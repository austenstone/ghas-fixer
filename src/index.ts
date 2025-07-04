#!/usr/bin/env node
import 'dotenv/config';
import { GitHubSecurityAutofixer } from './autofixer.js';
import { RepositoryPrompts } from './utils/repository-prompts.js';
import { CliParser } from './utils/cli-parser.js';
import { createRequire } from 'module';
import { readFileSync } from 'fs';

export function getVersion(): string {
  const require = createRequire(import.meta.url);
  try {
    const packageJsonPath = require.resolve('../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || '1.0.0';
  } catch {
    try {
      const packageJsonPath = require.resolve('ghas-fixer/package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
      return packageJson.version || '1.0.0';
    } catch {
      try {
        const packageJsonPath = require.resolve('./package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        return packageJson.version || '1.0.0';
      } catch {
        return '1.0.0';
      }
    }
  }
}

async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const options = CliParser.parse(args);

    if (options.help) {
      CliParser.showHelp();
      return;
    }

    if (options.version) {
      console.log(`ghas-fixer v${getVersion()}`);
      return;
    }

    // Get token from options, environment, or prompt
    let token = options.token || process.env.GITHUB_TOKEN;
    if (!token && !options.yes) {
      token = await RepositoryPrompts.promptForToken();
    }

    if (!token) {
      throw new Error('GitHub token is required. Use --token, set GITHUB_TOKEN environment variable, or run without --yes flag.');
    }

    const autofixer = new GitHubSecurityAutofixer(token, options);
    await autofixer.start();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`❌ ${error.message}`);
    } else {
      console.error('❌ An unexpected error occurred:', error);
    }
    process.exit(1);
  }
}

import { fileURLToPath } from 'url';

// Check if this module is being run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}