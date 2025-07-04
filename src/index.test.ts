import { expect, test, describe, vi, beforeEach } from 'vitest'
import { getVersion } from './index.js'
import { readFileSync } from 'fs'

// Mock filesystem operations
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
}))

describe('🧪 Index Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should export getVersion function', () => {
    expect(typeof getVersion).toBe('function')
  })

  test('should return version from package.json', () => {
    const mockPackageJson = JSON.stringify({ version: '2.0.0' })
    vi.mocked(readFileSync).mockReturnValue(mockPackageJson)

    const version = getVersion()
    expect(version).toBe('2.0.0')
  })

  test('should return default version on error', () => {
    vi.mocked(readFileSync).mockImplementation(() => {
      throw new Error('File not found')
    })

    const version = getVersion()
    expect(version).toBe('1.0.0')
  })

  test('should handle invalid JSON in package.json', () => {
    vi.mocked(readFileSync).mockReturnValue('invalid json')

    const version = getVersion()
    expect(version).toBe('1.0.0')
  })

  test('should handle missing version in package.json', () => {
    const mockPackageJson = JSON.stringify({ name: 'test' })
    vi.mocked(readFileSync).mockReturnValue(mockPackageJson)

    const version = getVersion()
    expect(version).toBe('1.0.0')
  })
})