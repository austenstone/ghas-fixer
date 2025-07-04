#!/usr/bin/env bash

# GitHub Advanced Security Auto-Fixer Demo Script
# This script demonstrates the new CLI features

echo "🚀 GitHub Advanced Security Auto-Fixer Demo"
echo "==========================================="
echo

# Check if the tool is available
if ! command -v ghas-secret-fixer &> /dev/null; then
    echo "Installing ghas-secret-fixer..."
    npm install -g ghas-secret-fixer
fi

echo "📋 Available Commands:"
echo

echo "1. Show help:"
echo "   ghas-secret-fixer --help"
echo

echo "2. Show version:"
echo "   ghas-secret-fixer --version"
echo

echo "3. Interactive mode (default):"
echo "   ghas-secret-fixer"
echo

echo "4. Headless mode examples:"
echo "   # Fix all alerts in a specific repository"
echo "   ghas-secret-fixer -o myorg -r myrepo -y"
echo
echo "   # Fix alerts in multiple repositories"
echo "   ghas-secret-fixer -o myorg --repos \"repo1,repo2,repo3\" -y"
echo
echo "   # Fix only critical and high severity alerts"
echo "   ghas-secret-fixer -o myorg -r myrepo -s \"critical,high\" --create-pr -y"
echo
echo "   # Preview changes (dry run)"
echo "   ghas-secret-fixer -o myorg -r myrepo --dry-run"
echo
echo "   # Custom branch and PR details"
echo "   ghas-secret-fixer -o myorg -r myrepo -b security-fixes --pr-title \"Security fixes\" -y"
echo

echo "5. Environment variables:"
echo "   export GITHUB_TOKEN=your_token"
echo "   export GITHUB_ORG=myorg"
echo "   export GITHUB_REPO=myrepo"
echo "   ghas-secret-fixer -y"
echo

echo "6. Configuration file usage:"
echo "   ghas-secret-fixer --config config.json"
echo

echo "7. CI/CD integration:"
echo "   ghas-secret-fixer --org \$ORG --repos \$REPOS --yes --create-pr --quiet"
echo

echo "✨ Features:"
echo "- 🤖 Headless mode for automation"
echo "- 🎯 Advanced filtering by severity, state, and tool"
echo "- 🔀 Batch processing for multiple repositories"
echo "- 🏃 Dry-run mode to preview changes"
echo "- 🤖 Automatic PR creation"
echo "- 📝 Configuration file support"
echo "- 🌍 Environment variable support"
echo "- 🔇 Quiet and verbose modes"
echo
echo "🎉 Ready to use! Try 'ghas-secret-fixer --help' for more information."
