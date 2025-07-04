import type { CodeScanningAlert, CreateCodeScanningAutoFix, CommitCodeScanningAutoFix, GetStatusCodeScanningAutoFix, SpinnerInterface, Repository } from '../types.js';
export declare class GitHubApiService {
    private octokit;
    private spinner?;
    constructor(token: string);
    setSpinner(spinner: SpinnerInterface): void;
    fetchCodeScanningAlerts(org: string, repo?: string, filters?: {
        state?: string;
        severity?: string[];
        tool?: string;
    }): Promise<CodeScanningAlert[]>;
    getAutofixStatus(org: string, repo: string | undefined, alert: CodeScanningAlert): Promise<GetStatusCodeScanningAutoFix['response']['data']>;
    createAutofix(org: string, repo: string | undefined, alert: CodeScanningAlert): Promise<CreateCodeScanningAutoFix['response']['data']>;
    commitAutofix(org: string, repo: string | undefined, alert: CodeScanningAlert): Promise<CommitCodeScanningAutoFix['response']['data']>;
    createBranch(org: string, repo: string, branchName: string): Promise<void>;
    branchExists(org: string, repo: string, branchName: string): Promise<boolean>;
    mergeBranch(org: string, repo: string, baseBranch: string, headBranch: string): Promise<void>;
    createPullRequest(org: string, repo: string, title: string, body: string, headBranch: string, baseBranch?: string): Promise<{
        number: number;
        html_url: string;
    }>;
    fetchOrganizationRepositories(org: string): Promise<Repository[]>;
}
