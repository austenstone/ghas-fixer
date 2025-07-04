import { expect, test, describe, vi } from 'vitest'
import { ErrorHandler } from './error-handler.js'
import { RequestError } from '@octokit/request-error'

describe('🚨 Error Handler', () => {
  test('should format RequestError correctly', () => {
    const mockError = new RequestError('API rate limit exceeded', 403, {
      request: {
        method: 'GET',
        url: 'https://api.github.com/test',
        headers: {},
      },
      response: {
        status: 403,
        url: 'https://api.github.com/test',
        headers: {},
        data: {},
      },
    })

    const message = ErrorHandler.getMessage(mockError)
    expect(message).toContain('Request Error(403)')
    expect(message).toContain('API rate limit exceeded')
    expect(message).toContain('Status: 403')
  })

  test('should format regular Error correctly', () => {
    const error = new Error('Something went wrong')
    const message = ErrorHandler.getMessage(error)
    expect(message).toBe('Error - Something went wrong')
  })

  test('should format unknown error correctly', () => {
    const error = 'String error'
    const message = ErrorHandler.getMessage(error)
    expect(message).toBe('Error - String error')
  })

  test('should return correct emoji for critical severity', () => {
    const emoji = ErrorHandler.getSecuritySeverityEmoji('critical')
    expect(emoji).toBe('🚨')
  })

  test('should return correct emoji for high severity', () => {
    const emoji = ErrorHandler.getSecuritySeverityEmoji('high')
    expect(emoji).toBe('🔴')
  })

  test('should return correct emoji for medium severity', () => {
    const emoji = ErrorHandler.getSecuritySeverityEmoji('medium')
    expect(emoji).toBe('🟠')
  })

  test('should return correct emoji for low severity', () => {
    const emoji = ErrorHandler.getSecuritySeverityEmoji('low')
    expect(emoji).toBe('🟡')
  })

  test('should return default emoji for undefined severity', () => {
    const emoji = ErrorHandler.getSecuritySeverityEmoji(undefined)
    expect(emoji).toBe('⚪')
  })

  test('should return default emoji for null severity', () => {
    const emoji = ErrorHandler.getSecuritySeverityEmoji(null)
    expect(emoji).toBe('⚪')
  })

  test('should handle createSpinnerTimerMessage with undefined spinner', () => {
    // This should not throw an error
    expect(() => {
      ErrorHandler.createSpinnerTimerMessage(undefined, 5, 'Processing')
    }).not.toThrow()
  })

  test('should handle createSpinnerTimerMessage with mock spinner', () => {
    const mockSpinner = {
      message: vi.fn(),
    } as { message: (msg: string) => void }

    ErrorHandler.createSpinnerTimerMessage(mockSpinner as ReturnType<typeof import('@clack/prompts').spinner>, 1, 'Processing')
    
    expect(mockSpinner.message).toHaveBeenCalledWith('Processing Retrying after 1 seconds')
  })
})
