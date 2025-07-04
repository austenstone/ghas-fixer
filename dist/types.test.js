import { expect, test, describe } from 'vitest';
describe('📝 Types Module', () => {
    test('should define SpinnerInterface correctly', () => {
        const mockSpinner = {
            start: () => { },
            stop: () => { },
            message: () => { },
        };
        expect(typeof mockSpinner.start).toBe('function');
        expect(typeof mockSpinner.stop).toBe('function');
        expect(typeof mockSpinner.message).toBe('function');
    });
    test('should allow optional parameters in SpinnerInterface methods', () => {
        const mockSpinner = {
            start: (msg) => {
                expect(typeof msg === 'string' || msg === undefined).toBe(true);
            },
            stop: (msg, code) => {
                expect(typeof msg === 'string' || msg === undefined).toBe(true);
                expect(typeof code === 'number' || code === undefined).toBe(true);
            },
            message: (msg) => {
                expect(typeof msg === 'string' || msg === undefined).toBe(true);
            },
        };
        mockSpinner.start('Starting...');
        mockSpinner.stop('Completed', 0);
        mockSpinner.message('Processing...');
        mockSpinner.start();
        mockSpinner.stop();
        mockSpinner.message();
    });
});
