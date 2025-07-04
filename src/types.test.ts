import { expect, test, describe } from 'vitest'
import type { SpinnerInterface } from './types.js'

describe('📝 Types Module', () => {
  test('should define SpinnerInterface correctly', () => {
    const mockSpinner: SpinnerInterface = {
      start: () => {},
      stop: () => {},
      message: () => {},
    }

    expect(typeof mockSpinner.start).toBe('function')
    expect(typeof mockSpinner.stop).toBe('function')
    expect(typeof mockSpinner.message).toBe('function')
  })

  test('should allow optional parameters in SpinnerInterface methods', () => {
    const mockSpinner: SpinnerInterface = {
      start: (msg?: string) => {
        expect(typeof msg === 'string' || msg === undefined).toBe(true)
      },
      stop: (msg?: string, code?: number) => {
        expect(typeof msg === 'string' || msg === undefined).toBe(true)
        expect(typeof code === 'number' || code === undefined).toBe(true)
      },
      message: (msg?: string) => {
        expect(typeof msg === 'string' || msg === undefined).toBe(true)
      },
    }

    // Test with parameters
    mockSpinner.start('Starting...')
    mockSpinner.stop('Completed', 0)
    mockSpinner.message('Processing...')

    // Test without parameters
    mockSpinner.start()
    mockSpinner.stop()
    mockSpinner.message()
  })
})
