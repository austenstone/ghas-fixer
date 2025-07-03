# GitHub Advanced Security Auto-Fixer 🔧

A powerful CLI tool that automatically fixes code scanning alerts in your GitHub repositories using GitHub Advanced Security's autofix feature.

## Features ✨

- 🔍 Automatically fetches code scanning alerts from GitHub repositories
- 🤖 Uses GitHub's built-in autofix capabilities to generate fixes
- 📋 Interactive prompts for selecting alerts to fix
- 🌿 Creates a new branch with all the fixes applied
- 🔄 Supports both single repositories and organization-wide scanning
- 🛡️ Handles errors gracefully with detailed feedback

## Installation 📦

```bash
npm install -g gha-secret-fixer
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
gha-secret-fixer
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
gha-secret-fixer <owner/repo>

# Example
gha-secret-fixer microsoft/vscode
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