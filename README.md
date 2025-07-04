# GitHub Advanced Security Auto-Fixer 🔧

A powerful CLI tool that automatically fixes code scanning alerts in your GitHub repositories using GitHub Advanced Security's autofix feature.

## Features ✨

- 🔍 Automatically fetches code scanning alerts f### v1.2.0 (Current)
- ✨ Added headless mode support with `--yes` flag
- 🎯 Added advanced filtering by severity, state, and tool
- 🔀 Added batch processing for multiple repositories
- 🏃 Added dry-run mode with `--dry-run` flag
- 🤖 Added automatic PR creation options
- 🔧 Added comprehensive CLI argument support
- 📝 Added configuration file support
- 🌍 Added environment variable support
- 🔄 Enhanced CI/CD integration capabilities repositories
- 🤖 Uses GitHub's built-in autofix capabilities to generate fixes
- 📋 Interactive prompts for selecting alerts to fix
- 🌿 Creates a new branch with all the fixes applied
- 🔄 Supports both single repositories and organization-wide scanning
- 🏢 Organization mode: Select multiple repositories to scan at once
- 🛡️ Handles errors gracefully with detailed feedback
- 🤖 **Headless mode** for automation and CI/CD integration
- 🎯 **Advanced filtering** by severity, state, and tool
- 🔀 **Batch processing** for multiple repositories
- 🏃 **Dry-run mode** to preview changes before applying

## Installation 📦

```bash
npm install -g ghas-secret-fixer
```

## Usage 🚀

### Prerequisites

1. You need a GitHub Personal Access Token with the following scopes:
   - `repo` (for repository access)
   - `security_events` (for reading code scanning alerts)

2. Set your token as an environment variable:
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```

### Interactive Mode

```bash
ghas-secret-fixer
```

The tool will guide you through:
1. 🏢 Selecting a repository (or provide via command line arguments)
2. 📋 Reviewing available code scanning alerts
3. ✅ Choosing which alerts to fix
4. 🌿 Creating a new branch with the fixes
5. 🚀 Committing the autofix changes

### Headless Mode

For automation and CI/CD integration:

```bash
# Fix all alerts in a specific repository
ghas-secret-fixer --org myorg --repo myrepo --yes

# Fix alerts in multiple repositories
ghas-secret-fixer --org myorg --repos "repo1,repo2,repo3" --yes

# Fix only critical and high severity alerts
ghas-secret-fixer --org myorg --repo myrepo --severity "critical,high" --yes --create-pr

# Preview changes without applying them
ghas-secret-fixer --org myorg --repo myrepo --dry-run
```

## Command Line Options 🛠️

```bash
USAGE
  ghas-secret-fixer [OPTIONS]

OPTIONS
  -h, --help                 Show help message
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
```

## Examples 💡

### Basic Usage

```bash
# Interactive mode
ghas-secret-fixer

# Fix all alerts in a repository (headless)
ghas-secret-fixer -o myorg -r myrepo -y
```

### Advanced Filtering

```bash
# Fix only critical severity alerts
ghas-secret-fixer -o myorg -r myrepo -s critical -y

# Fix specific alerts by ID
ghas-secret-fixer -o myorg -r myrepo -a "1,2,3" -y

# Fix alerts from specific tool
ghas-secret-fixer -o myorg -r myrepo --tool CodeQL -y
```

### Multiple Repositories

```bash
# Fix alerts in multiple repositories
ghas-secret-fixer -o myorg --repos "api,frontend,backend" -y

# With custom branch name
ghas-secret-fixer -o myorg --repos "api,frontend" -b security-fixes -y
```

### Pull Request Management

```bash
# Automatically create PR with custom title and body
ghas-secret-fixer -o myorg -r myrepo -y --create-pr --pr-title "Security fixes" --pr-body "Automated security fixes"

# Skip PR creation
ghas-secret-fixer -o myorg -r myrepo -y --no-pr
```

### Dry Run and Debugging

```bash
# Preview what would be fixed
ghas-secret-fixer -o myorg -r myrepo --dry-run

# Verbose logging
ghas-secret-fixer -o myorg -r myrepo -y --verbose

# Quiet mode (errors only)
ghas-secret-fixer -o myorg -r myrepo -y --quiet
```

## Environment Variables 🌍

```bash
# GitHub token
export GITHUB_TOKEN=your_token_here

# Default organization
export GITHUB_ORG=myorg

# Default repository
export GITHUB_REPO=myrepo
```

## Configuration File 📝

Create a configuration file to store common settings:

```json
{
  "org": "myorg",
  "repos": ["api", "frontend", "backend"],
  "severity": ["critical", "high"],
  "createPr": true,
  "branch": "security-fixes",
  "timeout": 120
}
```

Use with `--config config.json`

## CI/CD Integration 🔄

Perfect for automated security workflows:

```yaml
# GitHub Actions example
name: Auto-fix Security Alerts
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  autofix:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install -g ghas-secret-fixer
      - run: ghas-secret-fixer --org ${{ github.repository_owner }} --repos "repo1,repo2" --yes --create-pr
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Development 🔨

### Build
```bash
npm run build
```

### Test
```bash
npm test
```

### Run Locally
```bash
npm start
```

### Development with Watch Mode
```bash
npm run dev
```

## Contributing 🤝

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support 🆘

If you encounter any issues or have questions, please [open an issue](https://github.com/austenstone/ghas-secret-fixer/issues) on GitHub.

## Changelog 📝

### v1.2.0
- ✨ Added headless mode support with `--yes` flag
- 🎯 Added advanced filtering by severity, state, and tool
- � Added batch processing for multiple repositories
- 🏃 Added dry-run mode with `--dry-run` flag
- 🤖 Added automatic PR creation options
- � Added comprehensive CLI argument support
- 📝 Added configuration file support
- 🌍 Added environment variable support
- � Enhanced CI/CD integration capabilities

### v1.1.0
- 🏢 Added organization mode support
- 📋 Improved alert selection interface
- 🛡️ Enhanced error handling

### v1.0.0
- � Initial release
- 🔍 Basic autofix functionality
- 📦 Single repository support

Created by [Austen Stone](https://github.com/austenstone)