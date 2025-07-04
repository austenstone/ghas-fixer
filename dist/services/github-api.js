import { Octokit } from 'octokit';
import * as clack from '@clack/prompts';
import { ErrorHandler } from '../utils/error-handler.js';
export class GitHubApiService {
    octokit;
    spinner;
    constructor(token) {
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
                    return false;
                },
            }
        });
    }
    setSpinner(spinner) {
        this.spinner = spinner;
    }
    async fetchCodeScanningAlerts(org, repo, filters) {
        const alerts = [];
        if (repo) {
            const params = {
                owner: org,
                repo: repo,
                state: filters?.state || 'open',
                tool_name: filters?.tool || 'CodeQL',
            };
            for await (const response of this.octokit.paginate.iterator('GET /repos/{owner}/{repo}/code-scanning/alerts', params)) {
                alerts.push(...response.data);
                this.spinner?.message(`🔍 Found ${alerts.length} code scanning alerts...`);
            }
        }
        else {
            const params = {
                org: org,
                state: filters?.state || 'open',
                tool_name: filters?.tool || 'CodeQL',
            };
            for await (const response of this.octokit.paginate.iterator('GET /orgs/{org}/code-scanning/alerts', params)) {
                alerts.push(...response.data);
                this.spinner?.message(`🔍 Found ${alerts.length} code scanning alerts...`);
            }
        }
        let filteredAlerts = alerts;
        if (filters?.severity && filters.severity.length > 0) {
            filteredAlerts = alerts.filter(alert => filters.severity.includes(alert.rule.security_severity_level || 'low'));
        }
        filteredAlerts.sort((a, b) => {
            const severities = ['low', 'medium', 'high', 'critical'];
            return severities.indexOf(b.rule.security_severity_level || 'low') - severities.indexOf(a.rule.security_severity_level || 'low');
        });
        return filteredAlerts;
    }
    async getAutofixStatus(org, repo, alert) {
        const endpoint = repo
            ? 'GET /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix'
            : 'GET /orgs/{org}/code-scanning/alerts/{alert_number}/autofix';
        const params = repo
            ? { owner: org, repo: repo, alert_number: alert.number }
            : { org: org, alert_number: alert.number };
        const response = await this.octokit.request(endpoint, params);
        return response.data;
    }
    async createAutofix(org, repo, alert) {
        const endpoint = repo
            ? 'POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix'
            : 'POST /orgs/{org}/code-scanning/alerts/{alert_number}/autofix';
        const params = repo
            ? { owner: org, repo: repo, alert_number: alert.number }
            : { org: org, alert_number: alert.number };
        const response = await this.octokit.request(endpoint, params);
        return response.data;
    }
    async commitAutofix(org, repo, alert) {
        const endpoint = repo
            ? 'POST /repos/{owner}/{repo}/code-scanning/alerts/{alert_number}/autofix/commits'
            : 'POST /orgs/{org}/code-scanning/alerts/{alert_number}/autofix/commits';
        const params = repo
            ? { owner: org, repo: repo, alert_number: alert.number }
            : { org: org, alert_number: alert.number };
        const response = await this.octokit.request(endpoint, params);
        return response.data;
    }
    async createBranch(org, repo, branchName) {
        const { data: repoData } = await this.octokit.rest.repos.get({
            owner: org,
            repo: repo
        });
        const { data: ref } = await this.octokit.rest.git.getRef({
            owner: org,
            repo: repo,
            ref: `heads/${repoData.default_branch}`
        });
        await this.octokit.rest.git.createRef({
            owner: org,
            repo: repo,
            ref: `refs/heads/${branchName}`,
            sha: ref.object.sha
        });
    }
    async branchExists(org, repo, branchName) {
        try {
            await this.octokit.rest.git.getRef({
                owner: org,
                repo: repo,
                ref: `heads/${branchName}`
            });
            return true;
        }
        catch {
            return false;
        }
    }
    async mergeBranch(org, repo, baseBranch, headBranch) {
        await this.octokit.rest.repos.merge({
            owner: org,
            repo: repo,
            base: baseBranch,
            head: headBranch
        });
    }
    async createPullRequest(org, repo, title, body, headBranch, baseBranch = 'main') {
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
    async fetchOrganizationRepositories(org) {
        const repos = [];
        for await (const response of this.octokit.paginate.iterator('GET /orgs/{org}/repos', {
            org: org,
            type: 'all',
            sort: 'updated',
            direction: 'desc',
            per_page: 100
        })) {
            repos.push(...response.data);
            this.spinner?.message(`📦 Found ${repos.length} repositories...`);
        }
        return repos;
    }
}
