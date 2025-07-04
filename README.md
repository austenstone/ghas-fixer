# GitHub Advanced Security Auto-Fixer 🔧

A powerful CLI tool that automatically fixes code scanning alerts in your GitHub repositories using GitHub Advanced Security's autofix feature.

After triggering autofix for all available code scanning alerts it will merge them all into a PR for you to review and merge. You could technically auto merge the PR if you wanted to.

```bash
npx ghas-fixer
```


## Installation 📦

```bash
npm install -g ghas-fixer
```

## Usage 🚀

### Prerequisites

1. Node
1. You need a GitHub Personal Access Token with the following scopes:
   - `repo` (for repository access)
   - `security_events` (for reading code scanning alerts)
2. Set your token as an environment variable:
   ```bash
   export GITHUB_TOKEN=ghp_your_token_here
   ```

### Interactive Mode

```bash
ghas-fixer
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
ghas-fixer --org myorg --repo myrepo --yes

# Fix alerts in multiple repositories
ghas-fixer --org myorg --repos "repo1,repo2,repo3" --yes

# Fix only critical and high severity alerts
ghas-fixer --org myorg --repo myrepo --severity "critical,high" --yes --create-pr

# Preview changes without applying them
ghas-fixer --org myorg --repo myrepo --dry-run
```

## Command Line Options 🛠️

```bash
USAGE
  ghas-fixer [OPTIONS]

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
ghas-fixer

# Fix all alerts in a repository (headless)
ghas-fixer -o myorg -r myrepo -y
```

### Advanced Filtering

```bash
# Fix only critical severity alerts
ghas-fixer -o myorg -r myrepo -s critical -y

# Fix specific alerts by ID
ghas-fixer -o myorg -r myrepo -a "1,2,3" -y

# Fix alerts from specific tool
ghas-fixer -o myorg -r myrepo --tool CodeQL -y
```

### Multiple Repositories

```bash
# Fix alerts in multiple repositories
ghas-fixer -o myorg --repos "api,frontend,backend" -y

# With custom branch name
ghas-fixer -o myorg --repos "api,frontend" -b security-fixes -y
```

### Pull Request Management

```bash
# Automatically create PR with custom title and body
ghas-fixer -o myorg -r myrepo -y --create-pr --pr-title "Security fixes" --pr-body "Automated security fixes"

# Skip PR creation
ghas-fixer -o myorg -r myrepo -y --no-pr
```

### Dry Run and Debugging

```bash
# Preview what would be fixed
ghas-fixer -o myorg -r myrepo --dry-run

# Verbose logging
ghas-fixer -o myorg -r myrepo -y --verbose

# Quiet mode (errors only)
ghas-fixer -o myorg -r myrepo -y --quiet
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
name: Autofix Code Scanning Alerts
permissions:
  contents: write
  pull-requests: write
  security-events: write
on:
  schedule:
    - cron: '0 0 * * *'  # Runs daily at midnight
  workflow_dispatch:

jobs:
  autofix:
    runs-on: ubuntu-latest
    steps:
      - run: npx ghas-fixer -y -o ${ORG} -r ${REPOSITORY}
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPOSITORY: ${{ github.event.repository.name }}
          ORG: ${{ github.repository_owner }}

```

## License 📄

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support 🆘

If you encounter any issues or have questions, please [open an issue](https://github.com/austenstone/ghas-fixer/issues) on GitHub.

## Changelog 📝

### v1.2.0
- ✨ Added headless mode support with `--yes` flag
- 🎯 Added advanced filtering by severity, state, and tool
- � Added batch processing for multiple repositories
- 🏃 Added dry-run mode with `--dry-run` flag
- 🤖 Added automatic PR creation options
- 🧠 Added comprehensive CLI argument support
- 📝 Added configuration file support
- 🌍 Added environment variable support
- 🚗 Enhanced CI/CD integration capabilities

### v1.1.0
- 🏢 Added organization mode support
- 📋 Improved alert selection interface
- 🛡️ Enhanced error handling

### v1.0.0
- 🎉 Initial release
- 🔍 Basic autofix functionality
- 📦 Single repository support

Created by [Austen Stone](https://github.com/austenstone)