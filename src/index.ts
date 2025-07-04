#!/usr/bin/env node
import 'dotenv/config';
import { GitHubSecurityAutofixer } from './autofixer.js';
import { RepositoryPrompts } from './utils/repository-prompts.js';
import { CliParser } from './utils/cli-parser.js';

async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const options = CliParser.parse(args);

    if (options.help) {
      CliParser.showHelp();
      return;
    }

    if (options.version) {
      CliParser.showVersion();
      return;
    }

    // Get token from options, environment, or GitHub CLI
    let token = options.token || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token && !options.yes) {
      token = await RepositoryPrompts.promptForToken();
    }

    if (!token) {
      throw new Error('GitHub token is required. Use --token, set GITHUB_TOKEN/GH_TOKEN environment variable, or run without --yes flag.');
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

if (process.argv[1]) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}