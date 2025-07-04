#!/usr/bin/env node
import 'dotenv/config';
import { GitHubSecurityAutofixer } from './autofixer.js';
import { RepositoryPrompts } from './prompts/repository-prompts.js';
import { CliParser } from './utils/cli-parser.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getVersion(): string {
  try {
    const packageJsonPath = join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    return packageJson.version || '1.0.0';
  } catch {
    return '1.0.0';
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
      console.log(`ghas-secret-fixer v${getVersion()}`);
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

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});