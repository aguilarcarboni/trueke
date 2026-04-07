import { describe, it, expect } from 'vitest'
import {
  getConditionLabel,
  getConditionStyle,
  getConditionBadgeStyle,
  getStatusLabel,
  getStatusStyle,
  ITEM_CONDITION_LABELS,
  ITEM_STATUS_LABELS,
  ITEM_CONDITION_STYLES,
  ITEM_CONDITION_BADGE_STYLES,
  ITEM_STATUS_STYLES,
  ITEM_CONDITIONS,
  ITEM_STATUSES,
  type ItemCondition,
  type ItemStatus,
} from './item'

describe('getConditionLabel', () => {
  it.each(ITEM_CONDITIONS)('returns correct label for "%s"', (condition) => {
    expect(getConditionLabel(condition)).toBe(ITEM_CONDITION_LABELS[condition])
  })

  it('returns the raw string for an unknown condition', () => {
    expect(getConditionLabel('scratched')).toBe('scratched')
  })
})

describe('getConditionStyle', () => {
  it.each(ITEM_CONDITIONS)('returns a style for "%s"', (condition) => {
    expect(getConditionStyle(condition)).toBe(ITEM_CONDITION_STYLES[condition])
  })

  it('returns empty string for an unknown condition', () => {
    expect(getConditionStyle('scratched')).toBe('')
  })
})

describe('getConditionBadgeStyle', () => {
  it.each(ITEM_CONDITIONS)('returns a badge style for "%s"', (condition) => {
    expect(getConditionBadgeStyle(condition)).toBe(ITEM_CONDITION_BADGE_STYLES[condition])
  })

  it('returns empty string for an unknown condition', () => {
    expect(getConditionBadgeStyle('scratched')).toBe('')
  })
})

describe('new and like-new conditions share success badge style', () => {
  it('new and like new both use success variant', () => {
    expect(getConditionBadgeStyle('new')).toContain('success')
    expect(getConditionBadgeStyle('like new')).toContain('success')
  })

  it('broken uses destructive variant', () => {
    expect(getConditionBadgeStyle('broken')).toContain('destructive')
  })
})

describe('getStatusLabel', () => {
  it.each(ITEM_STATUSES)('returns correct label for "%s"', (status) => {
    expect(getStatusLabel(status)).toBe(ITEM_STATUS_LABELS[status])
  })

  it('returns the raw string for an unknown status', () => {
    expect(getStatusLabel('suspended')).toBe('suspended')
  })
})

describe('getStatusStyle', () => {
  it.each(ITEM_STATUSES)('returns a style for "%s"', (status) => {
    expect(getStatusStyle(status)).toBe(ITEM_STATUS_STYLES[status])
  })

  it('returns empty string for an unknown status', () => {
    expect(getStatusStyle('suspended')).toBe('')
  })
})
