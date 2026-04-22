import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { vi } from 'vitest'
import {
  normalizeMessageTimestamp,
  formatMessageTimestamp,
  MESSAGE_MAX_LENGTH,
} from './message'

// Fixed "now" for deterministic assertions: 2026-04-06T15:00:00Z
const NOW = new Date('2026-04-06T15:00:00.000Z')

describe('MESSAGE_MAX_LENGTH', () => {
  it('equals 500', () => {
    expect(MESSAGE_MAX_LENGTH).toBe(500)
  })
})

describe('normalizeMessageTimestamp', () => {
  it('appends Z to a bare datetime string', () => {
    expect(normalizeMessageTimestamp('2024-03-18 14:00:00')).toBe(
      '2024-03-18 14:00:00Z'
    )
  })

  it('leaves a string ending in Z unchanged', () => {
    expect(normalizeMessageTimestamp('2024-03-18T14:00:00Z')).toBe(
      '2024-03-18T14:00:00Z'
    )
  })

  it('leaves a +HH:MM offset unchanged', () => {
    expect(normalizeMessageTimestamp('2024-03-18T14:00:00+05:30')).toBe(
      '2024-03-18T14:00:00+05:30'
    )
  })

  it('leaves a -HH:MM offset unchanged', () => {
    expect(normalizeMessageTimestamp('2024-03-18T14:00:00-03:00')).toBe(
      '2024-03-18T14:00:00-03:00'
    )
  })
})

describe('formatMessageTimestamp', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a time string (AM/PM) for a message from today', () => {
    const ts = new Date(NOW.getTime() - 30 * 60 * 1000).toISOString()
    const result = formatMessageTimestamp(ts)
    expect(result).toMatch(/(AM|PM)/i)
  })

  it('returns "Yesterday" for a message from yesterday', () => {
    const yesterday = new Date(NOW)
    yesterday.setDate(yesterday.getDate() - 1)
    const ts = yesterday.toISOString()
    expect(formatMessageTimestamp(ts)).toBe('Yesterday')
  })

  it('returns a short date for older messages (same year)', () => {
    const twoWeeksAgo = new Date(NOW.getTime() - 14 * 24 * 60 * 60 * 1000)
    const ts = twoWeeksAgo.toISOString()
    const result = formatMessageTimestamp(ts)
    expect(result).toMatch(/[A-Z][a-z]{2}/)
    expect(result).not.toBe('Yesterday')
    expect(result).not.toMatch(/(AM|PM)/i)
  })

  it('includes year for messages from a different year', () => {
    const lastYear = new Date('2025-01-15T10:00:00Z').toISOString()
    const result = formatMessageTimestamp(lastYear)
    expect(result).toContain('2025')
  })
})
