#!/usr/bin/env node
import 'dotenv/config';
import { GitHubSecurityAutofixer } from './autofixer.js';
import { RepositoryPrompts } from './prompts/repository-prompts.js';

async function main(): Promise<void> {
  let token = process.env.GITHUB_TOKEN;

  if (!token) {
    token = await RepositoryPrompts.promptForToken();
  }

  const autofixer = new GitHubSecurityAutofixer(token);
  await autofixer.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});