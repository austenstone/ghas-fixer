import type { CliOptions } from './utils/cli-parser.js';
export declare class GitHubSecurityAutofixer {
    private api;
    private org;
    private repo;
    private selectedRepos;
    private options;
    constructor(token: string, options?: CliOptions);
    start(): Promise<void>;
    private log;
    private outro;
    private selectAlerts;
    private showDryRunResults;
    private promptForRepository;
    private fetchCodeScanningAlerts;
    private processAutofixes;
    private createAutofixes;
    private commitAutofixes;
    private createBranch;
    private handlePullRequestCreation;
}
