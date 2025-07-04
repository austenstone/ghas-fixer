import * as clack from '@clack/prompts';
export declare class ErrorHandler {
    static getMessage(error: unknown): string;
    static getSecuritySeverityEmoji(securitySeverity?: 'critical' | 'high' | 'medium' | 'low' | null | undefined): string;
    static createSpinnerTimerMessage(spinner: ReturnType<typeof clack.spinner> | undefined, retryAfter: number, message: string): void;
}
