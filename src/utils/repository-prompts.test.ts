import { expect, test, describe, vi, beforeEach } from 'vitest'
import { RepositoryPrompts } from './repository-prompts.js'
import * as clack from '@clack/prompts'

// Mock clack prompts
vi.mock('@clack/prompts', () => ({
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  confirm: vi.fn(),
  password: vi.fn(),
  spinner: vi.fn(),
  log: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  isCancel: vi.fn(),
}))

describe('🔐 Repository Prompts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should be defined', () => {
    expect(RepositoryPrompts).toBeDefined()
  })

  test('should have promptForToken method', () => {
    expect(typeof RepositoryPrompts.promptForToken).toBe('function')
  })

  test('should call password prompt for token', async () => {
    const mockToken = 'ghp_test123'
    vi.mocked(clack.password).mockResolvedValue(mockToken)

    const result = await RepositoryPrompts.promptForToken()
    
    expect(clack.password).toHaveBeenCalledWith({
      message: 'Enter your GitHub token:',
      validate: expect.any(Function),
    })
    expect(result).toBe(mockToken)
  })

  test('should validate token input', async () => {
    vi.mocked(clack.password).mockResolvedValue('ghp_test123')

    await RepositoryPrompts.promptForToken()
    
    const call = vi.mocked(clack.password).mock.calls[0]?.[0]
    const validateFn = call?.validate

    if (validateFn) {
      // Test empty token
      expect(validateFn('')).toBe('GitHub token is required')
      
      // Test valid token
      expect(validateFn('ghp_test123')).toBeUndefined()
      
      // Test invalid token format
      expect(validateFn('invalid_token')).toBe('Token should start with ghp_ or github_pat_')
    }
  })

  test('should handle cancelled token prompt', async () => {
    const cancelSymbol = Symbol('cancelled')
    vi.mocked(clack.password).mockResolvedValue(cancelSymbol)
    vi.mocked(clack.isCancel).mockReturnValue(true)

    await expect(RepositoryPrompts.promptForToken()).rejects.toThrow('process.exit unexpectedly called with "0"')
  })
})
