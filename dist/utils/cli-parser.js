export class CliParser {
    static HELP_TEXT = `
GitHub Advanced Security Autofix CLI

USAGE
 gh-ghas-fixer[OPTIONS]
  ghgh-ghas-fixer[OPTIONS]

DESCRIPTION
  Automatically fixes code scanning alerts in GitHub repositories using 
  GitHub Advanced Security's autofix feature. After triggering autofix 
  for all available code scanning alerts, it will merge them all into 
  a PR for you to review and merge.

OPTIONS
  -h, --help                 Show this help message
  -v, --version              Show version number
  -y, --yes                  Skip all prompts and use defaults
  -t, --token <token>        GitHub personal access token
  -o, --org <org>            GitHub organization name
  -r, --repo <repo>          Single repository name
  --repos <repos>            Comma-separated list of repositories
  -b, --branch <branch>      Branch name for fixes (default: autofixes)
  -a, --alerts <alerts>      Comma-separated list of alert IDs to fix
  -s, --severity <severity>  Filter by severity (critical,high,medium,low,warning,note,error)
  --state <state>            Filter by state (open,dismissed,fixed)
  --tool <tool>              Filter by tool name
  --create-pr                Automatically create pull request
  --no-pr                    Skip pull request creation
  --pr-title <title>         Pull request title
  --pr-body <body>           Pull request body
  --timeout <seconds>        Timeout for autofix operations (default: 60)
  --verbose                  Enable verbose logging
  --quiet                    Suppress non-error output
  --config <file>            Load configuration from file
  --dry-run                  Show what would be fixed without making changes

EXAMPLES
  # Interactive mode
  ghas-fixer

  # Fix all alerts in a specific repository
 gh-ghas-fixer-o myorg -r myrepo -y

  # Fix specific alerts in multiple repositories
 gh-ghas-fixer-o myorg --repos "repo1,repo2,repo3" -a "1,2,3"

  # Fix only critical and high severity alerts
 gh-ghas-fixer-o myorg -r myrepo -s "critical,high" --create-pr

  # Dry run to see what would be fixed
 gh-ghas-fixer-o myorg -r myrepo --dry-run

  # Use specific token and branch name
 gh-ghas-fixer-t ghp_xxx -o myorg -r myrepo -b security-fixes

ENVIRONMENT VARIABLES
  GITHUB_TOKEN    GitHub personal access token
  GITHUB_ORG      Default GitHub organization
  GITHUB_REPO     Default GitHub repository
`;
    static parse(args) {
        const options = {};
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            const nextArg = args[i + 1];
            switch (arg) {
                case '-h':
                case '--help':
                    options.help = true;
                    break;
                case '-v':
                case '--version':
                    options.version = true;
                    break;
                case '-y':
                case '--yes':
                    options.yes = true;
                    break;
                case '-t':
                case '--token':
                    options.token = this.consumeArgument(nextArg, 'token');
                    i++;
                    break;
                case '-o':
                case '--org':
                    options.org = this.consumeArgument(nextArg, 'org');
                    i++;
                    break;
                case '-r':
                case '--repo':
                    options.repo = this.consumeArgument(nextArg, 'repo');
                    i++;
                    break;
                case '--repos':
                    options.repos = this.consumeArgument(nextArg, 'repos').split(',').map(r => r.trim());
                    i++;
                    break;
                case '-b':
                case '--branch':
                    options.branch = this.consumeArgument(nextArg, 'branch');
                    i++;
                    break;
                case '-a':
                case '--alerts':
                    options.alerts = this.consumeArgument(nextArg, 'alerts').split(',').map(a => a.trim());
                    i++;
                    break;
                case '-s':
                case '--severity':
                    options.severity = this.consumeArgument(nextArg, 'severity').split(',').map(s => s.trim());
                    i++;
                    break;
                case '--state':
                    options.state = this.consumeArgument(nextArg, 'state');
                    i++;
                    break;
                case '--tool':
                    options.tool = this.consumeArgument(nextArg, 'tool');
                    i++;
                    break;
                case '--create-pr':
                    options.createPr = true;
                    break;
                case '--no-pr':
                    options.noPr = true;
                    break;
                case '--pr-title':
                    options.prTitle = this.consumeArgument(nextArg, 'pr-title');
                    i++;
                    break;
                case '--pr-body':
                    options.prBody = this.consumeArgument(nextArg, 'pr-body');
                    i++;
                    break;
                case '--timeout':
                    options.timeout = parseInt(this.consumeArgument(nextArg, 'timeout'), 10);
                    if (isNaN(options.timeout) || options.timeout <= 0) {
                        throw new Error('Timeout must be a positive number');
                    }
                    i++;
                    break;
                case '--verbose':
                    options.verbose = true;
                    break;
                case '--quiet':
                    options.quiet = true;
                    break;
                case '--config':
                    options.config = this.consumeArgument(nextArg, 'config');
                    i++;
                    break;
                case '--dry-run':
                    options.dryRun = true;
                    break;
                default:
                    if (arg.startsWith('-')) {
                        throw new Error(`Unknown option: ${arg}`);
                    }
                    break;
            }
        }
        this.validateOptions(options);
        return options;
    }
    static consumeArgument(arg, option) {
        if (!arg || arg.startsWith('-')) {
            throw new Error(`Option --${option} requires a value`);
        }
        return arg;
    }
    static validateOptions(options) {
        if (options.createPr && options.noPr) {
            throw new Error('Cannot use both --create-pr and --no-pr');
        }
        if (options.verbose && options.quiet) {
            throw new Error('Cannot use both --verbose and --quiet');
        }
        if (options.repo && options.repos) {
            throw new Error('Cannot use both --repo and --repos');
        }
        if (options.severity) {
            const validSeverities = ['critical', 'high', 'medium', 'low', 'warning', 'note', 'error'];
            const invalidSeverities = options.severity.filter(s => !validSeverities.includes(s));
            if (invalidSeverities.length > 0) {
                throw new Error(`Invalid severity levels: ${invalidSeverities.join(', ')}`);
            }
        }
        if (options.state) {
            const validStates = ['open', 'dismissed', 'fixed'];
            if (!validStates.includes(options.state)) {
                throw new Error(`Invalid state: ${options.state}. Must be one of: ${validStates.join(', ')}`);
            }
        }
    }
    static showHelp() {
        console.log(this.HELP_TEXT);
    }
    static showVersion() {
        const packageJson = process.env.npm_package_version || '1.0.0';
        console.log(`gh-ghas-fixer v${packageJson}`);
    }
}
