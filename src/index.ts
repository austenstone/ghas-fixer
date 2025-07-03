#!/usr/bin/env node
import 'dotenv/config';
import { Octokit } from '@octokit/rest';
import * as clack from '@clack/prompts';
import type { Endpoints } from '@octokit/types';
import type { components } from '@octokit/openapi-types';
import { writeFileSync } from 'fs';
import { RequestError } from "@octokit/request-error";

type CodeScanningAlert = components['schemas']['code-scanning-alert'];
type ListOrgCodeScanningAlerts = Endpoints['GET /orgs/{org}/code-scanning/alerts'];
type ListRepoCodeScanningAlerts = Endpoints['GET /repos/{owner}/{repo}/code-scanning/alerts'];
// type CreateAutofixParams = Endpoints['POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix']['parameters'];
type CreateCodeScanningAutoFix = Endpoints['POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix']
type CommitCodeScanningAutoFix = Endpoints['POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix/commits']
type GetStatusCodeScanningAutoFix = Endpoints['GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix'];

class GitHubSecurityAutofixer {
  private octokit: Octokit;
  private org: string = '';
  private repo: string = '';

  constructor() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
    this.octokit = new Octokit({ auth: token, log: undefined });
  }

  private getSecuritySeverityEmoji(securitySeverity?: "critical" | "high" | "medium" | "low" | null | undefined): string {
    switch (securitySeverity) {
      case 'critical':
        return '🚨';
      case 'high':
        return '🔴';
      case 'medium':
        return '🟠';
      case 'low':
        return '🟡';
      default:
        return '⚪';
    }
  }

  async start(): Promise<void> {
    clack.intro('🔒 GitHub Advanced Security Autofixer');

    try {
      await this.promptForRepository();
      const alerts = await this.fetchCodeScanningAlerts();

      if (alerts.length === 0) {
        clack.outro('✅ No code scanning alerts found!');
        return;
      }

      writeFileSync('alerts.json', JSON.stringify(alerts, null, 2));

      const selectedAlerts = await this.promptForAlertSelection(alerts);

      if (selectedAlerts.length === 0) {
        clack.outro('👋 No alerts selected. Goodbye!');
        return;
      }

      const fixedAlerts = await this.processAutofixes(selectedAlerts);
      clack.outro(`🤖 Fixed ${fixedAlerts.length} code scanning alerts!`);
    } catch (error) {
      clack.cancel(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  }

  private async promptForRepository(): Promise<void> {
    const target = process.argv[2];

    if (target) {
      if (target.includes('/')) {
        const [owner, repo] = target.split('/');
        this.org = owner;
        this.repo = repo;
        clack.log.info(`📁 Using repository: ${owner}/${repo}`);
      } else {
        this.org = target;
        clack.log.info(`🏢 Using organization: ${target}`);
      }
      return;
    }

    if (!this.org && (!this.repo && !this.org)) {
      const mode = await clack.select({
        message: 'Select repository mode:',
        options: [
          { value: 'org', label: '🏢 Organization (all repositories)' },
          { value: 'repo', label: '📁 Specific repository' }
        ]
      });

      if (clack.isCancel(mode)) {
        clack.cancel('Operation cancelled');
        process.exit(0);
      }

      if (mode === 'org') {
        const orgInput = await clack.text({
          message: 'Enter organization name:',
          placeholder: 'my-org',
          validate: (value) => value.length === 0 ? 'Organization name is required' : undefined
        });

        if (clack.isCancel(orgInput)) {
          clack.cancel('Operation cancelled');
          process.exit(0);
        }

        this.org = orgInput;
      } else {
        const repoInput = await clack.text({
          message: 'Enter repository (owner/repo):',
          placeholder: 'owner/repository',
          validate: (value) => {
            if (value.length === 0) return 'Repository is required';
            if (!value.includes('/')) return 'Repository must be in format owner/repo';
            return undefined;
          }
        });

        if (clack.isCancel(repoInput)) {
          clack.cancel('Operation cancelled');
          process.exit(0);
        }

        const [owner, repo] = repoInput.split('/');
        this.org = owner;
        this.repo = repo;
      }
    }

  }

  private async fetchCodeScanningAlerts(): Promise<CodeScanningAlert[]> {
    const spinner = clack.spinner();
    spinner.start('🔍 Fetching code scanning alerts...');

    try {
      let alerts: CodeScanningAlert[] = [];

      if (this.repo) {
        // Fetch alerts for specific repository
        const params: ListRepoCodeScanningAlerts['parameters'] = {
          owner: this.org,
          repo: this.repo,
          state: 'open',
          tool_name: 'CodeQL',
          per_page: 100
        };
        const response = await this.octokit.request('GET /repos/{owner}/{repo}/code-scanning/alerts', params);
        alerts = response.data;
      } else {
        // Fetch alerts for organization
        const params: ListOrgCodeScanningAlerts['parameters'] = {
          org: this.org,
          state: 'open',
          tool_name: 'CodeQL',
          per_page: 100
        };
        const response = await this.octokit.request('GET /orgs/{org}/code-scanning/alerts', params);
        alerts = response.data;
      }

      alerts.sort((a, b) => {
        const severities = ['low', 'medium', 'high', 'critical'];
        return severities.indexOf(b.rule.security_severity_level || 'low') - severities.indexOf(a.rule.security_severity_level || 'low');
      });
      spinner.stop(`Found ${alerts.length} open code scanning alerts`);
      return alerts;
    } catch (error) {
      spinner.stop('Failed to fetch alerts');
      throw error;
    }
  }

  private async promptForAlertSelection(alerts: CodeScanningAlert[]): Promise<CodeScanningAlert[]> {
    const options = [
      {
        value: 'all',
        label: `🎯 Select all alerts (${alerts.length} alerts)`,
        hint: 'Fix all available alerts'
      },
      ...alerts.map((alert) => ({
        value: alert.number.toString(),
        label: `${this.getSecuritySeverityEmoji(alert.rule.security_severity_level)} ${alert.rule.description || alert.rule.name || alert.rule.id} #${alert.number.toString().padEnd(3, ' ')}`,
        hint: `${alert.most_recent_instance?.location ? `${alert.most_recent_instance.location.path}:${alert.most_recent_instance.location.start_line}` : 'No location available'}`
      }))
    ];

    const selected = await clack.multiselect({
      message: 'Select alerts to fix:',
      options,
      required: false
    });

    if (clack.isCancel(selected)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    if (selected.includes('all')) {
      return alerts;
    }

    const selectedNumbers = selected.map(Number);
    return alerts.filter(alert => selectedNumbers.includes(alert.number));
  }

  private async processAutofixes(alerts: CodeScanningAlert[]): Promise<CommitCodeScanningAutoFix['response']['data'][]> {
    clack.log.info(`🤖 Autofixing ${alerts.length} alert${alerts.length > 1 ? 's' : ''}...`);

    const alertsWithAutoFixes: CodeScanningAlert[] = [];
    for (const [, alert] of alerts.entries()) {
      const spinner = clack.spinner();
      try {
        spinner.start(`#${alert.number}: Creating autofix ${alert.rule.name}`);
        await this.createAutofix(alert);
        spinner.stop(`#${alert.number}: Autofix created`);
        alertsWithAutoFixes.push(alert);
      } catch (error) {
        spinner.stop(`#${alert.number}: Error - ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    const successfullyFixedAlerts: CommitCodeScanningAutoFix['response']['data'][] = [];

    if (alertsWithAutoFixes.length === 0) {
      return successfullyFixedAlerts;
    }

    const confirmed = await clack.confirm({
      message: `Ready to commit autofixes for ${alertsWithAutoFixes.length} alert${alertsWithAutoFixes.length > 1 ? 's' : ''}?`,
      initialValue: true,
      active: 'Yes, commit autofixes',
      inactive: 'No, cancel'
    });

    if (!confirmed) {
      return successfullyFixedAlerts;
    }

    let base: CommitCodeScanningAutoFix["response"]["data"] | undefined = undefined;

    for (const [, alert] of alertsWithAutoFixes.entries()) {
      let result = `#${alert.number}: Waiting for autofix ${alert.rule.name}`;
      const spinner = clack.spinner();
      spinner.start(result);

      try {
        let status: GetStatusCodeScanningAutoFix['response']['data'];
        let attempts = 0;
        do {
          status = await this.getAutofixStatus(alert);
          if (status.status === 'success') {
            spinner.message(`#${alert.number}: Committing autofix`);
            const commit = await this.commitAutofix(alert);
            result = `#${alert.number}: Autofix committed (${commit.target_ref})`;
            if (commit.target_ref && commit.sha) {
              if (!base || !base.target_ref) {
                base = commit;
              } else {
                await this.octokit.rest.repos.merge({
                  owner: this.org,
                  repo: this.repo,
                  base: base.target_ref, // or the default branch of your repo
                  head: commit.target_ref
                });
              }
            }
            successfullyFixedAlerts.push(commit);
          } else if (status.status === 'pending') {
            spinner.message(`#${alert.number}: ⏳ Autofix is still pending.`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else if (status.status === 'outdated') {
            result = `#${alert.number}: Autofix is outdated.`;
            break;
          } else {
            result = `#${alert.number}: Autofix failed ${status.description}`;
            break;
          }
          ++attempts;
        } while (status.status === 'pending' && attempts < 60);
      } catch (error) {
        if (error instanceof RequestError) {
          result = `#${alert.number}: Request Error(${error.status}) - ${error.message} (Status: ${error.status})`;
        } else {
          result = `#${alert.number}: Error - ${error instanceof Error ? error.message : String(error)}`;
        }
      } finally {
        spinner.stop(`#${alert.number}: ${result}`);
      }
    }

    return successfullyFixedAlerts;
  }

  private async getAutofixStatus(alert: CodeScanningAlert): Promise<GetStatusCodeScanningAutoFix['response']['data']> {
    const endpoint = this.repo
      ? 'GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix'
      : 'GET /orgs/{org}/code-scanning/alerts/{alert_number}/autofix';

    const params = this.repo
      ? { owner: this.org, repo: this.repo, alert_number: alert.number }
      : { org: this.org, alert_number: alert.number };

    const response = await this.octokit.request(endpoint, params);
    return response.data;
  }

  private async createAutofix(alert: CodeScanningAlert): Promise<CreateCodeScanningAutoFix['response']['data']> {
    const endpoint = this.repo
      ? 'POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix'
      : 'POST /orgs/{org}/code-scanning/alerts/{alert_number}/autofix';

    const params = this.repo
      ? { owner: this.org, repo: this.repo, alert_number: alert.number }
      : { org: this.org, alert_number: alert.number };

    const response = await this.octokit.request(endpoint, params);
    return response.data;
  }

  private async commitAutofix(alert: CodeScanningAlert): Promise<CommitCodeScanningAutoFix['response']['data']> {
    const endpoint = this.repo
      ? 'POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix/commits'
      : 'POST /orgs/{org}/code-scanning/alerts/{alert_number}/autofix/commits';

    const params = this.repo
      ? { owner: this.org, repo: this.repo, alert_number: alert.number }
      : { org: this.org, alert_number: alert.number };

    const response = await this.octokit.request(endpoint, params);
    return response.data;
  }

}

async function main(): Promise<void> {
  const autofixer = new GitHubSecurityAutofixer();
  await autofixer.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});