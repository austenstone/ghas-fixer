import * as clack from '@clack/prompts';
import type { CodeScanningAlert, CommitCodeScanningAutoFix } from './types.js';
import { GitHubApiService } from './services/github-api.js';
import { RepositoryPrompts } from './utils/repository-prompts.js';
import { ErrorHandler } from './utils/error-handler.js';
import type { CliOptions } from './utils/cli-parser.js';

export class GitHubSecurityAutofixer {
  private api: GitHubApiService;
  private org: string = '';
  private repo: string = '';
  private selectedRepos: string[] = [];
  private options: CliOptions;

  constructor(token: string, options: CliOptions = {}) {
    this.api = new GitHubApiService(token);
    this.options = options;

    // Set org and repo from options or environment
    this.org = options.org || process.env.GITHUB_ORG || '';
    this.repo = options.repo || process.env.GITHUB_REPO || '';

    if (options.repos) {
      this.selectedRepos = options.repos;
    }
  }

  async start(): Promise<void> {
    try {
      // Show dry run message if enabled
      if (this.options.dryRun) {
        this.log('🔍 Running in dry-run mode - no changes will be made');
      }

      await this.promptForRepository();
      const alerts = await this.fetchCodeScanningAlerts();

      if (alerts.length === 0) {
        this.outro('✅ No code scanning alerts found!');
        return;
      }

      const selectedAlerts = await this.selectAlerts(alerts);
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

      if (this.options.dryRun) {
        this.showDryRunResults(alertsByRepo);
        return;
      }

      const totalFixedAlerts: CommitCodeScanningAutoFix['response']['data'][] = [];
      for (const [repoName, alerts] of Object.entries(alertsByRepo)) {
        this.log(`🔍 Processing alerts for repository: ${repoName}`);
        const fixedAlerts = await this.processAutofixes(alerts, repoName);
        this.log(`🤖 Fixed ${fixedAlerts.length} code scanning alerts in ${repoName}!`);
        totalFixedAlerts.push(...fixedAlerts);
      }

      const repoCount = Object.keys(alertsByRepo).length;
      this.outro(`🎉 Fixed ${totalFixedAlerts.length} code scanning alerts ${repoCount > 1 ? `in ${repoCount} repositories!` : ''}`);
    } catch (error) {
      clack.cancel(ErrorHandler.getMessage(error));
      process.exit(1);
    }
  }

  private log(message: string): void {
    if (!this.options.quiet) {
      if (this.options.verbose) {
        console.log(message);
      } else {
        clack.log.info(message);
      }
    }
  }

  private outro(message: string): void {
    if (!this.options.quiet) {
      clack.outro(message);
    }
  }

  private async selectAlerts(alerts: CodeScanningAlert[]): Promise<CodeScanningAlert[]> {
    // If specific alerts are requested via CLI
    if (this.options.alerts && this.options.alerts.length > 0) {
      const alertNumbers = this.options.alerts.map(a => parseInt(a, 10));
      const selectedAlerts = alerts.filter(alert => alertNumbers.includes(alert.number));

      if (selectedAlerts.length === 0) {
        throw new Error(`No alerts found with IDs: ${this.options.alerts.join(', ')}`);
      }

      this.log(`🎯 Selected ${selectedAlerts.length} alerts by ID`);
      return selectedAlerts;
    }

    // If running in headless mode, select all alerts
    if (this.options.yes) {
      this.log(`🎯 Auto-selecting all ${alerts.length} alerts`);
      return alerts;
    }

    // Interactive mode
    return await RepositoryPrompts.promptForAlertSelection(alerts);
  }

  private showDryRunResults(alertsByRepo: Record<string, CodeScanningAlert[]>): void {
    console.log('\n🔍 Dry Run Results:');
    console.log('==================');

    for (const [repoName, alerts] of Object.entries(alertsByRepo)) {
      console.log(`\n📦 Repository: ${repoName}`);
      console.log(`   Alerts to fix: ${alerts.length}`);

      if (this.options.verbose) {
        for (const alert of alerts) {
          console.log(`   - #${alert.number}: ${alert.rule.name} (${alert.rule.severity})`);
        }
      }
    }

    const totalAlerts = Object.values(alertsByRepo).flat().length;
    console.log(`\n✅ Total alerts that would be fixed: ${totalAlerts}`);
    console.log('💡 Run without --dry-run to apply fixes');
  }

  private async promptForRepository(): Promise<void> {
    if (this.org && (this.repo || this.selectedRepos.length > 0)) {
      this.log(`🎯 Organization: ${this.org}`);
      if (this.repo) {
        this.log(`🎯 Using repository: ${this.repo}`);
      } else {
        this.log(`🎯 Using repositories: ${this.selectedRepos.join(', ')}`);
      }
      return;
    }

    // If running in headless mode but missing required info
    if (this.options.yes) {
      throw new Error('Organization and repository information required for headless mode. Use --org and --repo or --repos flags.');
    }

    const { org, repo } = await RepositoryPrompts.promptForRepository(process.argv);
    this.org = org;
    this.repo = repo;

    // If no specific repo was selected, prompt for repository selection
    if (!repo) {
      const spinner = clack.spinner();
      this.api.setSpinner(spinner);
      spinner.start('📦 Fetching organization repositories...');

      try {
        const repositories = await this.api.fetchOrganizationRepositories(this.org);
        spinner.stop(`Found ${repositories.length} repositories in ${this.org}`);

        if (repositories.length === 0) {
          throw new Error(`No repositories found in organization: ${this.org}`);
        }

        const selectedRepositories = await RepositoryPrompts.promptForRepositorySelection(repositories);
        this.selectedRepos = selectedRepositories.map(repo => repo.name);

        this.log(`🎯 Selected ${this.selectedRepos.length} repositories for scanning`);
      } catch (error) {
        spinner.stop(`Failed to fetch repositories: ${ErrorHandler.getMessage(error)}`);
        throw error;
      }
    }
  }

  private async fetchCodeScanningAlerts(): Promise<CodeScanningAlert[]> {
    const spinner = clack.spinner();
    this.api.setSpinner(spinner);

    if (this.repo) {
      // Single repository mode
      spinner.start('🔍 Fetching code scanning alerts...');
      try {
        const alerts = await this.api.fetchCodeScanningAlerts(this.org, this.repo, {
          state: this.options.state,
          severity: this.options.severity,
          tool: this.options.tool
        });
        spinner.stop(`Found ${alerts.length} open code scanning alerts`);
        return alerts;
      } catch (error) {
        spinner.stop(`Failed to fetch alerts: ${ErrorHandler.getMessage(error)}`);
        throw error;
      }
    } else {
      // Organization mode - fetch alerts for selected repositories
      spinner.start('🔍 Fetching code scanning alerts from selected repositories...');

      try {
        const allAlerts: CodeScanningAlert[] = [];
        let totalProcessed = 0;

        for (const repoName of this.selectedRepos) {
          totalProcessed++;
          spinner.message(`🔍 Scanning ${repoName} (${totalProcessed}/${this.selectedRepos.length})`);

          try {
            const alerts = await this.api.fetchCodeScanningAlerts(this.org, repoName, {
              state: this.options.state,
              severity: this.options.severity,
              tool: this.options.tool
            });
            allAlerts.push(...alerts);
            this.log(`📦 ${repoName}: Found ${alerts.length} alerts`);
          } catch (error) {
            this.log(`⚠️ ${repoName}: Failed to fetch alerts - ${ErrorHandler.getMessage(error)}`);
          }
        }

        spinner.stop(`Found ${allAlerts.length} total open code scanning alerts across ${this.selectedRepos.length} repositories`);
        return allAlerts;
      } catch (error) {
        spinner.stop(`Failed to fetch alerts: ${ErrorHandler.getMessage(error)}`);
        throw error;
      }
    }
  }

  private async processAutofixes(alerts: CodeScanningAlert[], repo: string = this.repo): Promise<CommitCodeScanningAutoFix['response']['data'][]> {
    this.log(`🤖 Autofixing ${alerts.length} alert${alerts.length > 1 ? 's' : ''}...`);

    const alertsWithAutoFixes = await this.createAutofixes(alerts, repo);

    if (alertsWithAutoFixes.length === 0) {
      return [];
    }

    const confirmed = this.options.yes || await RepositoryPrompts.confirmAutofixes(alertsWithAutoFixes.length);
    if (!confirmed) {
      return [];
    }

    let branchName = this.options.branch || 'autofixes';
    if (!this.options.yes) {
      branchName = this.options.branch || await RepositoryPrompts.promptForBranchName(
        'autofixes',
        (name) => this.api.branchExists(this.org, repo, name)
      );
    }

    await this.createBranch(branchName, repo);

    const successfullyFixedAlerts = await this.commitAutofixes(alertsWithAutoFixes, branchName, repo);

    if (successfullyFixedAlerts.length > 0) {
      await this.handlePullRequestCreation(alertsWithAutoFixes, branchName, repo);
    }

    return successfullyFixedAlerts;
  }

  private async createAutofixes(alerts: CodeScanningAlert[], repo: string = this.repo): Promise<CodeScanningAlert[]> {
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

  private async commitAutofixes(
    alerts: CodeScanningAlert[],
    branchName: string,
    repo: string = this.repo
  ): Promise<CommitCodeScanningAutoFix['response']['data'][]> {
    const successfullyFixedAlerts: CommitCodeScanningAutoFix['response']['data'][] = [];
    const timeout = this.options.timeout || 60;

    for (const alert of alerts) {
      let result = `Waiting for autofix ${alert.rule.name}`;
      const spinner = clack.spinner();
      spinner.start(result);
      this.api.setSpinner(spinner);

      try {
        let attempts = 0;
        let status = await this.api.getAutofixStatus(this.org, repo, alert);

        while (status.status === 'pending' && attempts < timeout) {
          spinner.message(`⏳ Autofix is still pending.`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          try {
            status = await this.api.getAutofixStatus(this.org, repo, alert);
          } catch (error) {
            this.log(`⚠️ Error checking autofix status: ${ErrorHandler.getMessage(error)}`);
            throw error;
          }
          attempts++;
        }

        if (status.status === 'success') {
          spinner.message(`Committing autofix`);
          let commit: CommitCodeScanningAutoFix['response']['data'];
          try {
            commit = await this.api.commitAutofix(this.org, repo, alert);
          } catch (error) {
            this.log(`⚠️ Failed to commit autofix: ${ErrorHandler.getMessage(error)}`);
            throw error;
          }
          result = `Autofix committed (${commit.target_ref})`;

          spinner.message(`Merging autofix`);
          if (commit.target_ref && commit.sha) {
            try {
              await this.api.mergeBranch(this.org, repo, branchName, commit.target_ref);
            } catch (error) {
              this.log(`⚠️ Failed to merge autofix: ${ErrorHandler.getMessage(error)}`);
              throw error;
            }
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

  private async createBranch(branchName: string, repo: string = this.repo): Promise<void> {
    try {
      await this.api.createBranch(this.org, repo, branchName);
      this.log(`🌿 Created branch: ${branchName}`);
    } catch (error) {
      this.log(`⚠️ Could not create branch: ${ErrorHandler.getMessage(error)}`);
    }
  }

  private async handlePullRequestCreation(
    successfullyFixedAlerts: CodeScanningAlert[],
    branchName: string,
    repo: string = this.repo
  ): Promise<void> {
    // Check CLI options for PR creation
    if (this.options.noPr) {
      const compareUrl = `https://github.com/${this.org}/${repo}/compare/${branchName}`;
      this.log(`🔗 Create a PR for fixes: ${compareUrl}`);
      return;
    }

    const shouldCreatePr = this.options.createPr ||
      this.options.yes ||
      await RepositoryPrompts.confirmPullRequestCreation(successfullyFixedAlerts.length);

    if (shouldCreatePr) {
      let title = this.options.prTitle || `Fix ${successfullyFixedAlerts.length} security alert${successfullyFixedAlerts.length > 1 ? 's' : ''}`;
      const body = this.options.prBody || `Potential fixes for ${successfullyFixedAlerts.length} code scanning alerts:
${successfullyFixedAlerts.map(alert => `- ${alert.html_url}`).join('\n')}

_Suggested fixes powered by Copilot Autofix. Review carefully before merging._

Automated using [austenstone/ghas-fixer](https://github.com/austenstone/ghas-fixer)`;

      if (!title || !body) {
        if (!this.options.yes) {
          title = await RepositoryPrompts.promptForPullRequestDetails(successfullyFixedAlerts);
        }
      }

      const spinner = clack.spinner();
      spinner.start('🔄 Creating pull request...');

      try {
        const pr = await this.api.createPullRequest(this.org, repo, title, body, branchName);
        spinner.stop(`✅ Pull request created successfully!`);
        this.log(`🔗 View your PR: ${pr.html_url}`);
      } catch (error) {
        spinner.stop(`❌ Failed to create pull request: ${ErrorHandler.getMessage(error)}`);
        const compareUrl = `https://github.com/${this.org}/${repo}/compare/${branchName}`;
        this.log(`🔗 Create a PR manually: ${compareUrl}`);
      }
    } else {
      const compareUrl = `https://github.com/${this.org}/${repo}/compare/${branchName}`;
      this.log(`🔗 Create a PR for fixes: ${compareUrl}`);
    }
  }
}
