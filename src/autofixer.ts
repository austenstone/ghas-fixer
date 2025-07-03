import * as clack from '@clack/prompts';
import type { CodeScanningAlert, CommitCodeScanningAutoFix } from './types.js';
import { GitHubApiService } from './services/github-api.js';
import { RepositoryPrompts } from './prompts/repository-prompts.js';
import { ErrorHandler } from './utils/error-handler.js';

export class GitHubSecurityAutofixer {
  private api: GitHubApiService;
  private org: string = '';
  private repo: string = '';

  constructor(token: string) {
    this.api = new GitHubApiService(token);
  }

  async start(): Promise<void> {
    try {
      await this.promptForRepository();
      const alerts = await this.fetchCodeScanningAlerts();

      if (alerts.length === 0) {
        clack.outro('✅ No code scanning alerts found!');
        return;
      }

      const selectedAlerts = await RepositoryPrompts.promptForAlertSelection(alerts);
      if (selectedAlerts.length === 0) {
        throw new Error('No alerts selected.');
      }

      const alertsByRepo = selectedAlerts.reduce((acc, alert) => {
        const urlParts = alert.url.split('/');
        const repoIndex = urlParts.findIndex(part => part === 'repos') + 2; // +2 to get past 'repos' and owner
        const repoName = urlParts[repoIndex];
        if (!acc[repoName]) acc[repoName] = [];
        acc[repoName].push(alert);
        return acc;
      }, {} as Record<string, CodeScanningAlert[]>);

      const totalFixedAlerts: CommitCodeScanningAutoFix['response']['data'][] = [];
      for (const [repoName, alerts] of Object.entries(alertsByRepo)) {
        clack.log.info(`🔍 Processing alerts for repository: ${repoName}`);
        const fixedAlerts = await this.processAutofixes(alerts, repoName);
        clack.log.info(`🤖 Fixed ${fixedAlerts.length} code scanning alerts in ${repoName}!`);
        totalFixedAlerts.push(...fixedAlerts);
      }

      const repoCount = Object.keys(alertsByRepo).length;
      clack.outro(`🎉 Fixed ${totalFixedAlerts.length} code scanning alerts ${repoCount > 1 ? `in ${repoCount} repositories!` : ''}`);
    } catch (error) {
      clack.cancel(ErrorHandler.getMessage(error));
      process.exit(1);
    }
  }

  private async promptForRepository(): Promise<void> {
    const { org, repo } = await RepositoryPrompts.promptForRepository(process.argv);
    this.org = org;
    this.repo = repo;
  }

  private async fetchCodeScanningAlerts(): Promise<CodeScanningAlert[]> {
    const spinner = clack.spinner();
    this.api.setSpinner(spinner);
    spinner.start('🔍 Fetching code scanning alerts...');

    try {
      const alerts = await this.api.fetchCodeScanningAlerts(this.org, this.repo);
      spinner.stop(`Found ${alerts.length} open code scanning alerts`);
      return alerts;
    } catch (error) {
      spinner.stop(`Failed to fetch alerts: ${ErrorHandler.getMessage(error)}`);
      throw error;
    }
  }

  private async processAutofixes(alerts: CodeScanningAlert[], repo=this.repo): Promise<CommitCodeScanningAutoFix['response']['data'][]> {
    clack.log.info(`🤖 Autofixing ${alerts.length} alert${alerts.length > 1 ? 's' : ''}...`);

    const alertsWithAutoFixes = await this.createAutofixes(alerts, repo);

    if (alertsWithAutoFixes.length === 0) {
      return [];
    }

    const confirmed = await RepositoryPrompts.confirmAutofixes(alertsWithAutoFixes.length);
    if (!confirmed) {
      return [];
    }

    const branchName = await RepositoryPrompts.promptForBranchName(
      'autofixes',
      (name) => this.api.branchExists(this.org, repo, name)
    );

    await this.createBranch(branchName, repo);

    const successfullyFixedAlerts = await this.commitAutofixes(alertsWithAutoFixes, branchName);

    if (successfullyFixedAlerts.length > 0) {
      const href = `https://github.com/${this.org}/${repo}/compare/${branchName}`;
      clack.log.info(`🔗 Create a PR for fixes ${href}`);
    }

    return successfullyFixedAlerts;
  }

  private async createAutofixes(alerts: CodeScanningAlert[], repo=this.repo): Promise<CodeScanningAlert[]> {
    const alertsWithAutoFixes: CodeScanningAlert[] = [];

    for (const alert of alerts) {
      const spinner = clack.spinner();
      this.api.setSpinner(spinner);
      spinner.start(`#${alert.number}: Creating autofix ${alert.rule.name}`);

      try {
        await this.api.createAutofix(this.org, repo, alert);
        spinner.stop(`#${alert.number}: Autofix created`);
        alertsWithAutoFixes.push(alert);
      } catch (error) {
        spinner.stop(`Failed to create autofix for #${alert.number}: ${ErrorHandler.getMessage(error)}`);
      }
    }

    return alertsWithAutoFixes;
  }

  private async commitAutofixes(alerts: CodeScanningAlert[], branchName: string): Promise<CommitCodeScanningAutoFix['response']['data'][]> {
    const successfullyFixedAlerts: CommitCodeScanningAutoFix['response']['data'][] = [];

    for (const alert of alerts) {
      let result = `Waiting for autofix ${alert.rule.name}`;
      const spinner = clack.spinner();
      spinner.start(result);
      this.api.setSpinner(spinner);

      try {
        let attempts = 0;
        let status = await this.api.getAutofixStatus(this.org, this.repo, alert);

        while (status.status === 'pending' && attempts < 60) {
          spinner.message(`⏳ Autofix is still pending.`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          status = await this.api.getAutofixStatus(this.org, this.repo, alert);
          attempts++;
        }

        if (status.status === 'success') {
          spinner.message(`Committing autofix`);
          const commit = await this.api.commitAutofix(this.org, this.repo, alert);
          result = `Autofix committed (${commit.target_ref})`;

          if (commit.target_ref && commit.sha) {
            await this.api.mergeBranch(this.org, this.repo, branchName, commit.target_ref);
          }
          successfullyFixedAlerts.push(commit);
        } else if (status.status === 'outdated') {
          result = `Autofix is outdated.`;
        } else {
          result = `Autofix failed (${status.status}) ${status.description}`;
        }
      } catch (error) {
        result = `Failed to commit autofix - ${ErrorHandler.getMessage(error)}`;
      } finally {
        spinner.stop(`#${alert.number}: ${result}`);
      }
    }

    return successfullyFixedAlerts;
  }

  private async createBranch(branchName: string, repo=this.repo): Promise<void> {
    try {
      await this.api.createBranch(this.org, repo, branchName);
      clack.log.info(`🌿 Created branch: ${branchName}`);
    } catch (error) {
      clack.log.warn(`⚠️ Could not create branch (might already exist): ${ErrorHandler.getMessage(error)}`);
    }
  }
}
