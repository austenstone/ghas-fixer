# GitHub Advanced Security Auto-Fixer 🔧

A powerful CLI tool that automatically fixes code scanning alerts in your GitHub repositories using GitHub Advanced Security's autofix feature.

## Features ✨

- 🔍 Automatically fetches code scanning alerts from GitHub repositories
- 🤖 Uses GitHub's built-in autofix capabilities to generate fixes
- 📋 Interactive prompts for selecting alerts to fix
- 🌿 Creates a new branch with all the fixes applied
- 🔄 Supports both single repositories and organization-wide scanning
- 🏢 Organization mode: Select multiple repositories to scan at once
- 🛡️ Handles errors gracefully with detailed feedback

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

### Running the Tool

```bash
ghas-secret-fixer
```

The tool will guide you through:
1. 🏢 Selecting a repository (or provide via command line arguments)
2. 📋 Reviewing available code scanning alerts
3. ✅ Choosing which alerts to fix
4. 🌿 Creating a new branch with the fixes
5. 🚀 Committing the autofix changes

### Command Line Arguments

```bash
# Specify repository directly
ghas-secret-fixer <owner/repo>

# Specify organization (will prompt for repository selection)
ghas-secret-fixer <organization>

# Example
ghas-secret-fixer microsoft/vscode

# Organization example
ghas-secret-fixer github
```

### Organization Mode 🏢

When you select organization mode, the tool will:
1. 📦 Fetch all repositories in the organization
2. 🎯 Let you select which repositories to scan
3. 🔍 Aggregate code scanning alerts from all selected repositories
4. 📋 Display alerts with repository context
5. 🤖 Process fixes for each repository individually

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

### Lint
```bash
npm run lint
```

## Requirements 📋

- Node.js 18+ 
- GitHub Personal Access Token with appropriate scopes
- Repository with GitHub Advanced Security enabled

## License 📄

MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

## Author 👨‍💻

Created by [Austen Stone](https://github.com/austenstone)