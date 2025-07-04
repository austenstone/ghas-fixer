export interface CliOptions {
    help?: boolean;
    version?: boolean;
    yes?: boolean;
    token?: string;
    org?: string;
    repo?: string;
    repos?: string[];
    branch?: string;
    alerts?: string[];
    severity?: string[];
    state?: string;
    tool?: string;
    createPr?: boolean;
    noPr?: boolean;
    prTitle?: string;
    prBody?: string;
    timeout?: number;
    verbose?: boolean;
    quiet?: boolean;
    config?: string;
    dryRun?: boolean;
}
export declare class CliParser {
    private static readonly HELP_TEXT;
    static parse(args: string[]): CliOptions;
    private static consumeArgument;
    private static validateOptions;
    static showHelp(): void;
    static showVersion(): void;
}
