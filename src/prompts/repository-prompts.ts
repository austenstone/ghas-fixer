import * as clack from '@clack/prompts';
import type { CodeScanningAlert } from '../types.js';
import { ErrorHandler } from '../utils/error-handler.js';

export class RepositoryPrompts {
  static async promptForRepository(args: string[]): Promise<{ org: string; repo: string }> {
    const target = args[2];
    let org = '';
    let repo = '';

    if (target) {
      if (target.includes('/')) {
        const [owner, repoName] = target.split('/');
        org = owner;
        repo = repoName;
        clack.log.info(`📁 Using repository: ${owner}/${repoName}`);
      } else {
        org = target;
        clack.log.info(`🏢 Using organization: ${target}`);
      }
      return { org, repo };
    }

    const mode = await clack.select({
      message: 'Select repository mode:',
      options: [
        { value: 'org', label: '🏢 Organization (all repositories)' },
        { value: 'repo', label: '📁 Specific repository' }
      ]
    });

    if (clack.isCancel(mode)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    if (mode === 'org') {
      const orgInput = await clack.text({
        message: 'Enter organization name:',
        placeholder: 'my-org',
        validate: (value) => value.length === 0 ? 'Organization name is required' : undefined
      });

      if (clack.isCancel(orgInput)) {
        clack.cancel('Operation cancelled');
        process.exit(0);
      }

      org = orgInput;
    } else {
      const repoInput = await clack.text({
        message: 'Enter repository (owner/repo):',
        placeholder: 'owner/repository',
        validate: (value) => {
          if (value.length === 0) return 'Repository is required';
          if (!value.includes('/')) return 'Repository must be in format owner/repo';
          return undefined;
        }
      });

      if (clack.isCancel(repoInput)) {
        clack.cancel('Operation cancelled');
        process.exit(0);
      }

      const [owner, repoName] = repoInput.split('/');
      org = owner;
      repo = repoName;
    }

    return { org, repo };
  }

  static async promptForAlertSelection(alerts: CodeScanningAlert[]): Promise<CodeScanningAlert[]> {
    const options = [
      {
        value: 'all',
        label: `🎯 Select all alerts (${alerts.length} alerts)`,
        hint: 'Fix all available alerts'
      },
      ...alerts.map((alert) => ({
        value: alert.number.toString(),
        label: `${ErrorHandler.getSecuritySeverityEmoji(alert.rule.security_severity_level)} ${alert.rule.description || alert.rule.name || alert.rule.id} #${alert.number.toString().padEnd(3, ' ')}`,
        hint: `${alert.most_recent_instance?.location ? `${alert.most_recent_instance.location.path}:${alert.most_recent_instance.location.start_line}` : 'No location available'}`
      }))
    ];

    const selected = await clack.multiselect({
      message: 'Select alerts to fix:',
      options,
      required: false
    });

    if (clack.isCancel(selected)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    if (selected.includes('all')) {
      return alerts;
    }

    const selectedNumbers = selected.map(Number);
    return alerts.filter(alert => selectedNumbers.includes(alert.number));
  }

  static async promptForBranchName(initialBranchName: string, branchExistsCheck: (name: string) => Promise<boolean>): Promise<string> {
    let branchName = initialBranchName;
    let branchValid = false;

    do {
      branchName = await clack.text({
        message: 'Enter branch name for autofixes:',
        placeholder: 'autofixes',
        defaultValue: branchName,
        validate: (value) => {
          if (value.length === 0) return undefined;
          // Basic branch name validation
          if (!/^[a-zA-Z0-9._/-]+$/.test(value)) {
            return 'Branch name contains invalid characters';
          }
          return undefined;
        }
      }) as string;

      if (clack.isCancel(branchName)) {
        clack.cancel('Operation cancelled');
        process.exit(0);
      }

      if (await branchExistsCheck(branchName)) {
        clack.log.warn(`⚠️ Branch already exists: ${branchName}`);
      } else {
        branchValid = true;
      }
    } while (!branchValid);

    return branchName;
  }

  static async confirmAutofixes(count: number): Promise<boolean> {
    const confirmed = await clack.confirm({
      message: `Ready to commit autofixes for ${count} alert${count > 1 ? 's' : ''}?`,
      initialValue: true,
      active: 'Yes, commit autofixes',
      inactive: 'No, cancel'
    });

    return !clack.isCancel(confirmed) && confirmed;
  }

  static async promptForToken(): Promise<string> {
    clack.intro('🔒 GitHub Advanced Security Autofixer');

    const tokenInput = await clack.password({
      message: 'Enter your GitHub token:',
      validate: (value) => {
        if (value.length === 0) return 'GitHub token is required';
        if (!value.startsWith('ghp_') && !value.startsWith('github_pat_')) {
          return 'Token should start with ghp_ or github_pat_';
        }
        return undefined;
      }
    });

    if (clack.isCancel(tokenInput)) {
      clack.cancel('Operation cancelled');
      process.exit(0);
    }

    return tokenInput;
  }
}
