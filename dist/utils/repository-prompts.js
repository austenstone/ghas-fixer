import * as clack from '@clack/prompts';
import { ErrorHandler } from './error-handler.js';
export class RepositoryPrompts {
    static async promptForRepository(args) {
        const target = args[2];
        let org = '';
        let repo = '';
        if (target) {
            if (target.includes('/')) {
                const [owner, repoName] = target.split('/');
                org = owner;
                repo = repoName;
                clack.log.info(`📁 Using repository: ${owner}/${repoName}`);
            }
            else {
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
        }
        else {
            const repoInput = await clack.text({
                message: 'Enter repository (owner/repo):',
                placeholder: 'owner/repository',
                validate: (value) => {
                    if (value.length === 0)
                        return 'Repository is required';
                    if (!value.includes('/'))
                        return 'Repository must be in format owner/repo';
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
    static async promptForAlertSelection(alerts) {
        const options = [
            {
                value: 'all',
                label: `🎯 Select all alerts (${alerts.length} alerts)`,
                hint: 'Fix all available alerts'
            },
            ...alerts.map((alert) => {
                const urlParts = alert.url.split('/');
                const repoIndex = urlParts.findIndex(part => part === 'repos') + 2;
                const repoName = urlParts[repoIndex];
                return {
                    value: alert.number.toString(),
                    label: `${ErrorHandler.getSecuritySeverityEmoji(alert.rule.security_severity_level)} ${alert.rule.description || alert.rule.name || alert.rule.id} #${alert.number.toString().padEnd(3, ' ')}`,
                    hint: `[${repoName}] ${alert.most_recent_instance?.location ? `${alert.most_recent_instance.location.path}:${alert.most_recent_instance.location.start_line}` : 'No location available'}`
                };
            })
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
    static async promptForBranchName(initialBranchName, branchExistsCheck) {
        let branchName = initialBranchName;
        let branchValid = false;
        do {
            branchName = await clack.text({
                message: 'Enter branch name for autofixes:',
                placeholder: 'autofixes',
                defaultValue: branchName,
                validate: (value) => {
                    if (value.length === 0)
                        return undefined;
                    if (!/^[a-zA-Z0-9._/-]+$/.test(value)) {
                        return 'Branch name contains invalid characters';
                    }
                    return undefined;
                }
            });
            if (clack.isCancel(branchName)) {
                clack.cancel('Operation cancelled');
                process.exit(0);
            }
            if (await branchExistsCheck(branchName)) {
                clack.log.warn(`⚠️  Branch already exists: ${branchName}`);
            }
            else {
                branchValid = true;
            }
        } while (!branchValid);
        return branchName;
    }
    static async confirmAutofixes(count) {
        const confirmed = await clack.confirm({
            message: `Ready to commit autofixes for ${count} alert${count > 1 ? 's' : ''}?`,
            initialValue: true,
            active: 'Yes, commit autofixes',
            inactive: 'No, cancel'
        });
        return !clack.isCancel(confirmed) && confirmed;
    }
    static async promptForToken() {
        clack.intro('🔒 GitHub Advanced Security Autofixer');
        const tokenInput = await clack.password({
            message: 'Enter your GitHub token:',
            validate: (value) => {
                if (value.length === 0)
                    return 'GitHub token is required';
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
    static async confirmPullRequestCreation(alertCount) {
        const confirmed = await clack.confirm({
            message: `Create a pull request with ${alertCount} autofix${alertCount > 1 ? 'es' : ''}?`,
            initialValue: true,
            active: 'Yes, create PR',
            inactive: 'No, just show the link'
        });
        return !clack.isCancel(confirmed) && confirmed;
    }
    static async promptForPullRequestDetails(successfullyFixedAlerts) {
        const count = successfullyFixedAlerts.length;
        const title = await clack.text({
            message: 'Enter PR title:',
            placeholder: `Fix ${count} code scanning alert${count > 1 ? 's' : ''}`,
            initialValue: `Fix ${count} code scanning alert${count > 1 ? 's' : ''}`
        });
        if (clack.isCancel(title)) {
            clack.cancel('Operation cancelled');
            process.exit(0);
        }
        return title;
    }
    static async promptForRepositorySelection(repositories) {
        const options = [
            {
                value: 'all',
                label: `🎯 Select all repositories (${repositories.length} repositories)`,
                hint: 'Scan all repositories in the organization'
            },
            ...repositories
                .sort((a, b) => a.updated_at && b.updated_at ? new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime() : 0)
                .map((repo) => ({
                value: repo.name,
                label: `📦 ${repo.name}`,
                hint: `${repo.description || 'No description'} - Updated: ${repo.updated_at ? new Date(repo.updated_at).toLocaleDateString() : 'Unknown'}`
            }))
        ];
        const selected = await clack.multiselect({
            message: 'Select repositories to scan for code scanning alerts:',
            options,
            required: true
        });
        if (clack.isCancel(selected)) {
            clack.cancel('Operation cancelled');
            process.exit(0);
        }
        if (selected.includes('all')) {
            return repositories;
        }
        return repositories.filter(repo => selected.includes(repo.name));
    }
}
