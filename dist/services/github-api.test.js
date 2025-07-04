import { expect, test, describe, vi, beforeEach } from 'vitest';
import { GitHubApiService } from './github-api.js';
vi.mock('octokit', () => ({
    Octokit: vi.fn().mockImplementation(() => ({
        rest: {
            codeScanning: {
                listAlertsForOrg: vi.fn(),
                listAlertsForRepo: vi.fn(),
                createAutofix: vi.fn(),
                getAutofix: vi.fn(),
            },
            repos: {
                listForOrg: vi.fn(),
            },
        },
    })),
}));
describe('🐙 GitHub API Service', () => {
    let service;
    beforeEach(() => {
        vi.clearAllMocks();
        service = new GitHubApiService('fake-token');
    });
    test('should initialize with token', () => {
        expect(service).toBeInstanceOf(GitHubApiService);
    });
    test('should set spinner correctly', () => {
        const mockSpinner = {
            start: vi.fn(),
            stop: vi.fn(),
            message: vi.fn(),
        };
        expect(() => {
            service.setSpinner(mockSpinner);
        }).not.toThrow();
    });
    test('should create GitHubApiService instance', () => {
        const newService = new GitHubApiService('test-token-123');
        expect(newService).toBeInstanceOf(GitHubApiService);
    });
});
