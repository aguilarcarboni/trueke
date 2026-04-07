import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { vi } from 'vitest'
import {
  normalizeTimestamp,
  formatNotificationTime,
  getNotificationTypeLabel,
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
} from './notification'

const ALL_TYPES = Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]

// Fixed "now" for deterministic assertions: 2026-04-06T15:00:00Z (Monday afternoon)
const NOW = new Date('2026-04-06T15:00:00.000Z')

describe('normalizeTimestamp', () => {
  it('appends Z to a bare datetime string (no timezone info)', () => {
    expect(normalizeTimestamp('2024-03-18 14:00:00')).toBe('2024-03-18 14:00:00Z')
  })

  it('leaves a string that already ends with Z unchanged', () => {
    expect(normalizeTimestamp('2024-03-18T14:00:00Z')).toBe('2024-03-18T14:00:00Z')
  })

  it('leaves a lowercase z suffix unchanged', () => {
    expect(normalizeTimestamp('2024-03-18T14:00:00z')).toBe('2024-03-18T14:00:00z')
  })

  it('leaves a +HH:MM offset unchanged', () => {
    expect(normalizeTimestamp('2024-03-18T14:00:00+05:30')).toBe(
      '2024-03-18T14:00:00+05:30'
    )
  })

  it('leaves a -HH:MM offset unchanged', () => {
    expect(normalizeTimestamp('2024-03-18T14:00:00-07:00')).toBe(
      '2024-03-18T14:00:00-07:00'
    )
  })

  it('trims leading/trailing whitespace before appending Z', () => {
    expect(normalizeTimestamp('  2024-03-18 14:00:00  ')).toBe(
      '2024-03-18 14:00:00Z'
    )
  })
})

describe('formatNotificationTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "No date" for null', () => {
    expect(formatNotificationTime(null)).toBe('No date')
  })

  it('returns "Just now" for a timestamp under 2 minutes ago', () => {
    // 60 seconds ago
    const ts = new Date(NOW.getTime() - 60 * 1000).toISOString()
    expect(formatNotificationTime(ts)).toBe('Just now')
  })

  it('returns "Just now" for exact 119 seconds ago', () => {
    const ts = new Date(NOW.getTime() - 119 * 1000).toISOString()
    expect(formatNotificationTime(ts)).toBe('Just now')
  })

  it('returns a time string for today (same calendar day, >2min ago)', () => {
    // 30 minutes ago, still today
    const ts = new Date(NOW.getTime() - 30 * 60 * 1000).toISOString()
    const result = formatNotificationTime(ts)
    // Should look like a time (contains AM or PM)
    expect(result).toMatch(/(AM|PM)/i)
    // Should NOT contain 'Yesterday'
    expect(result).not.toContain('Yesterday')
  })

  it('returns "Yesterday, <time>" for a timestamp from yesterday', () => {
    const yesterday = new Date(NOW)
    yesterday.setDate(yesterday.getDate() - 1)
    const ts = yesterday.toISOString()
    const result = formatNotificationTime(ts)
    expect(result).toContain('Yesterday')
  })

  it('returns a date string for timestamps older than yesterday', () => {
    // Two weeks ago
    const twoWeeksAgo = new Date(NOW.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const result = formatNotificationTime(twoWeeksAgo)
    expect(result).not.toBe('Just now')
    expect(result).not.toContain('Yesterday')
    // Should contain a month abbreviation
    expect(result).toMatch(/[A-Z][a-z]{2}/)
  })

  it('includes the year for timestamps from a different year', () => {
    const lastYear = new Date('2025-01-15T10:00:00Z').toISOString()
    const result = formatNotificationTime(lastYear)
    expect(result).toContain('2025')
  })
})

describe('getNotificationTypeLabel', () => {
  it.each(ALL_TYPES)('returns correct label for type "%s"', (type) => {
    expect(getNotificationTypeLabel(type)).toBe(NOTIFICATION_TYPE_LABELS[type])
  })

  it('returns the type string itself for an unknown type', () => {
    expect(getNotificationTypeLabel('unknown_type' as NotificationType)).toBe(
      'unknown_type'
    )
  })

  it('covers all 13 notification types', () => {
    expect(ALL_TYPES).toHaveLength(13)
  })
})
