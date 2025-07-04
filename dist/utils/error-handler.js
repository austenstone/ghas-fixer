import { RequestError } from '@octokit/request-error';
export class ErrorHandler {
    static getMessage(error) {
        if (error instanceof RequestError) {
            return `Request Error(${error.status}) - ${error.message} (Status: ${error.status})`;
        }
        else {
            return `Error - ${error instanceof Error ? error.message : String(error)}`;
        }
    }
    static getSecuritySeverityEmoji(securitySeverity) {
        switch (securitySeverity) {
            case 'critical':
                return '🚨';
            case 'high':
                return '🔴';
            case 'medium':
                return '🟠';
            case 'low':
                return '🟡';
            default:
                return '⚪';
        }
    }
    static createSpinnerTimerMessage(spinner, retryAfter, message) {
        if (spinner) {
            spinner.message(`${message} Retrying after ${retryAfter} seconds`);
            let remainingTime = retryAfter;
            const interval = setInterval(() => {
                remainingTime -= 1;
                if (remainingTime <= 0) {
                    clearInterval(interval);
                }
                else {
                    spinner?.message(`${message} Retrying in ${remainingTime} seconds`);
                }
            }, 1000);
        }
    }
}
