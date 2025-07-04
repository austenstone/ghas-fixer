import { Octokit } from 'octokit';
import * as clack from '@clack/prompts';
import type {
  CodeScanningAlert,
  ListOrgCodeScanningAlerts,
  ListRepoCodeScanningAlerts,
  CreateCodeScanningAutoFix,
  CommitCodeScanningAutoFix,
  GetStatusCodeScanningAutoFix,
  SpinnerInterface,
  Repository
} from '../types.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class GitHubApiService {
  private octokit: Octokit;
  private spinner?: SpinnerInterface;

  constructor(token: string) {
    this.octokit = new Octokit({
      auth: token,
      log: {
        error: () => { },
        warn: () => { },
        info: () => { },
        debug: () => { },
      },
      throttle: {
        onRateLimit: (retryAfter, _options, _octokit, retryCount) => {
          if (retryCount < 1) {
            ErrorHandler.createSpinnerTimerMessage(this.spinner, retryAfter, 'Rate limit hit!');
            return true;
          }
          return false;
        },
        onSecondaryRateLimit: (retryAfter, options) => {
          clack.log.error(`SecondaryRateLimit detected for request ${options.method} ${options.url}, retryAfter: ${retryAfter}`);
          return false; // do not retry again
        },
      }
    });
  }

  setSpinner(spinner: SpinnerInterface): void {
    this.spinner = spinner;
  }

  async fetchCodeScanningAlerts(
    org: string, 
    repo?: string,
    filters?: {
      state?: string;
      severity?: string[];
      tool?: string;
    }
  ): Promise<CodeScanningAlert[]> {
    const alerts: CodeScanningAlert[] = [];

    if (repo) {
      // Fetch alerts for specific repository
      const params: ListRepoCodeScanningAlerts['parameters'] = {
        owner: org,
        repo: repo,
        state: (filters?.state as 'open' | 'dismissed' | 'fixed') || 'open',
        tool_name: filters?.tool || 'CodeQL',
      };

      for await (const response of this.octokit.paginate.iterator(
        'GET /repos/{owner}/{repo}/code-scanning/alerts',
        params,
      )) {
        alerts.push(...response.data);
        this.spinner?.message(`🔍 Found ${alerts.length} code scanning alerts...`);
      }
    } else {
      // Fetch alerts for organization
      const params: ListOrgCodeScanningAlerts['parameters'] = {
        org: org,
        state: (filters?.state as 'open' | 'dismissed' | 'fixed') || 'open',
        tool_name: filters?.tool || 'CodeQL',
      };

      for await (const response of this.octokit.paginate.iterator(
        'GET /orgs/{org}/code-scanning/alerts',
        params,
      )) {
        alerts.push(...response.data);
        this.spinner?.message(`🔍 Found ${alerts.length} code scanning alerts...`);
      }
    }

    // Filter by severity if specified
    let filteredAlerts = alerts;
    if (filters?.severity && filters.severity.length > 0) {
      filteredAlerts = alerts.filter(alert => 
        filters.severity!.includes(alert.rule.security_severity_level || 'low')
      );
    }

    filteredAlerts.sort((a, b) => {
      const severities = ['low', 'medium', 'high', 'critical'];
      return severities.indexOf(b.rule.security_severity_level || 'low') - severities.indexOf(a.rule.security_severity_level || 'low');
    });

    return filteredAlerts;
  }

  async getAutofixStatus(org: string, repo: string | undefined, alert: CodeScanningAlert): Promise<GetStatusCodeScanningAutoFix['response']['data']> {
    const endpoint = repo
      ? 'GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix'
      : 'GET /orgs/{org}/code-scanning/alerts/{alert_number}/autofix';

    const params = repo
      ? { owner: org, repo: repo, alert_number: alert.number }
      : { org: org, alert_number: alert.number };

    const response = await this.octokit.request(endpoint, params);
    return response.data;
  }

  async createAutofix(org: string, repo: string | undefined, alert: CodeScanningAlert): Promise<CreateCodeScanningAutoFix['response']['data']> {
    const endpoint = repo
      ? 'POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix'
      : 'POST /orgs/{org}/code-scanning/alerts/{alert_number}/autofix';

    const params = repo
      ? { owner: org, repo: repo, alert_number: alert.number }
      : { org: org, alert_number: alert.number };

    const response = await this.octokit.request(endpoint, params);
    return response.data;
  }

  async commitAutofix(org: string, repo: string | undefined, alert: CodeScanningAlert): Promise<CommitCodeScanningAutoFix['response']['data']> {
    const endpoint = repo
      ? 'POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix/commits'
      : 'POST /orgs/{org}/code-scanning/alerts/{alert_number}/autofix/commits';

    const params = repo
      ? { owner: org, repo: repo, alert_number: alert.number }
      : { org: org, alert_number: alert.number };

    const response = await this.octokit.request(endpoint, params);
    return response.data;
  }

  async createBranch(org: string, repo: string, branchName: string): Promise<void> {
    // Get the default branch
    const { data: repoData } = await this.octokit.rest.repos.get({
      owner: org,
      repo: repo
    });

    // Get the latest commit from the default branch
    const { data: ref } = await this.octokit.rest.git.getRef({
      owner: org,
      repo: repo,
      ref: `heads/${repoData.default_branch}`
    });

    // Create the new branch
    await this.octokit.rest.git.createRef({
      owner: org,
      repo: repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha
    });
  }

  async branchExists(org: string, repo: string, branchName: string): Promise<boolean> {
    try {
      await this.octokit.rest.git.getRef({
        owner: org,
        repo: repo,
        ref: `heads/${branchName}`
      });
      return true;
    } catch {
      return false;
    }
  }

  async mergeBranch(org: string, repo: string, baseBranch: string, headBranch: string): Promise<void> {
    await this.octokit.rest.repos.merge({
      owner: org,
      repo: repo,
      base: baseBranch,
      head: headBranch
    });
  }

  async createPullRequest(
    org: string, 
    repo: string, 
    title: string, 
    body: string, 
    headBranch: string, 
    baseBranch: string = 'main'
  ): Promise<{ number: number; html_url: string }> {
    const { data } = await this.octokit.rest.pulls.create({
      owner: org,
      repo: repo,
      title: title,
      body: body,
      head: headBranch,
      base: baseBranch
    });
    
    return {
      number: data.number,
      html_url: data.html_url
    };
  }

  async fetchOrganizationRepositories(org: string): Promise<Repository[]> {
    const repos: Repository[] = [];

    for await (const response of this.octokit.paginate.iterator(
      'GET /orgs/{org}/repos',
      {
        org: org,
        type: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 100
      }
    )) {
      repos.push(...response.data);
      this.spinner?.message(`📦 Found ${repos.length} repositories...`);
    }

    return repos;
  }
}
