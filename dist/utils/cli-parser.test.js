import { expect, test, describe } from 'vitest';
import { CliParser } from './cli-parser.js';
describe('🔧 CLI Parser', () => {
    test('should parse help flag', () => {
        const result = CliParser.parse(['--help']);
        expect(result.help).toBe(true);
    });
    test('should parse short help flag', () => {
        const result = CliParser.parse(['-h']);
        expect(result.help).toBe(true);
    });
    test('should parse version flag', () => {
        const result = CliParser.parse(['--version']);
        expect(result.version).toBe(true);
    });
    test('should parse short version flag', () => {
        const result = CliParser.parse(['-v']);
        expect(result.version).toBe(true);
    });
    test('should parse yes flag', () => {
        const result = CliParser.parse(['--yes']);
        expect(result.yes).toBe(true);
    });
    test('should parse token option', () => {
        const result = CliParser.parse(['--token', 'ghp_test123']);
        expect(result.token).toBe('ghp_test123');
    });
    test('should parse org option', () => {
        const result = CliParser.parse(['--org', 'myorg']);
        expect(result.org).toBe('myorg');
    });
    test('should parse repo option', () => {
        const result = CliParser.parse(['--repo', 'myrepo']);
        expect(result.repo).toBe('myrepo');
    });
    test('should parse repos option as array', () => {
        const result = CliParser.parse(['--repos', 'repo1,repo2,repo3']);
        expect(result.repos).toEqual(['repo1', 'repo2', 'repo3']);
    });
    test('should parse severity option as array', () => {
        const result = CliParser.parse(['--severity', 'critical,high']);
        expect(result.severity).toEqual(['critical', 'high']);
    });
    test('should parse multiple flags together', () => {
        const result = CliParser.parse(['--yes', '--verbose', '--org', 'testorg']);
        expect(result.yes).toBe(true);
        expect(result.verbose).toBe(true);
        expect(result.org).toBe('testorg');
    });
    test('should parse boolean flags correctly', () => {
        const result1 = CliParser.parse(['--create-pr', '--verbose']);
        expect(result1.createPr).toBe(true);
        expect(result1.verbose).toBe(true);
        const result2 = CliParser.parse(['--no-pr', '--dry-run']);
        expect(result2.noPr).toBe(true);
        expect(result2.dryRun).toBe(true);
    });
    test('should throw error when using conflicting flags', () => {
        expect(() => {
            CliParser.parse(['--create-pr', '--no-pr']);
        }).toThrow('Cannot use both --create-pr and --no-pr');
    });
    test('should throw error when missing required values', () => {
        expect(() => {
            CliParser.parse(['--token']);
        }).toThrow('Option --token requires a value');
    });
    test('should parse numeric options', () => {
        const result = CliParser.parse(['--timeout', '120']);
        expect(result.timeout).toBe(120);
    });
    test('should return empty options for no arguments', () => {
        const result = CliParser.parse([]);
        expect(result).toEqual({});
    });
});
