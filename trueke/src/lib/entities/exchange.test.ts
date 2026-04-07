import { describe, it, expect } from 'vitest'
import {
  getExchangeStatusLabel,
  getExchangeStatusStyle,
  EXCHANGE_STATUS_LABELS,
  EXCHANGE_STATUS_STYLES,
  type ExchangeStatus,
} from './exchange'

const ALL_STATUSES = Object.keys(EXCHANGE_STATUS_LABELS) as ExchangeStatus[]

describe('getExchangeStatusLabel', () => {
  it.each(ALL_STATUSES)('returns correct label for "%s"', (status) => {
    expect(getExchangeStatusLabel(status)).toBe(EXCHANGE_STATUS_LABELS[status])
  })

  it('returns the raw input for an unknown status', () => {
    expect(getExchangeStatusLabel('unknown_status')).toBe('unknown_status')
  })
})

describe('getExchangeStatusStyle', () => {
  it.each(ALL_STATUSES)('returns correct style for "%s"', (status) => {
    expect(getExchangeStatusStyle(status)).toBe(EXCHANGE_STATUS_STYLES[status])
  })

  it('returns empty string for an unknown status', () => {
    expect(getExchangeStatusStyle('unknown_status')).toBe('')
  })
})

describe('EXCHANGE_STATUS_LABELS completeness', () => {
  it('covers all six statuses', () => {
    const expected: ExchangeStatus[] = [
      'pending',
      'accepted',
      'rejected',
      'expired',
      'cancelled',
      'completed',
    ]
    expect(ALL_STATUSES.sort()).toEqual(expected.sort())
  })
})
