import type { CodeScanningAlert, Repository } from '../types.js';
export declare class RepositoryPrompts {
    static promptForRepository(args: string[]): Promise<{
        org: string;
        repo: string;
    }>;
    static promptForAlertSelection(alerts: CodeScanningAlert[]): Promise<CodeScanningAlert[]>;
    static promptForBranchName(initialBranchName: string, branchExistsCheck: (name: string) => Promise<boolean>): Promise<string>;
    static confirmAutofixes(count: number): Promise<boolean>;
    static promptForToken(): Promise<string>;
    static confirmPullRequestCreation(alertCount: number): Promise<boolean>;
    static promptForPullRequestDetails(successfullyFixedAlerts: CodeScanningAlert[]): Promise<string>;
    static promptForRepositorySelection(repositories: Repository[]): Promise<Repository[]>;
}
