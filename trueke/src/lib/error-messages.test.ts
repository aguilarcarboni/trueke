import { describe, it, expect } from 'vitest'
import { getFriendlyErrorMessage } from './error-messages'

describe('getFriendlyErrorMessage', () => {
  it('returns generic message for null', () => {
    expect(getFriendlyErrorMessage(null)).toBe('Something went wrong. Please try again.')
  })

  it('returns generic message for undefined', () => {
    expect(getFriendlyErrorMessage(undefined)).toBe('Something went wrong. Please try again.')
  })

  it('returns generic message for empty string', () => {
    expect(getFriendlyErrorMessage('')).toBe('Something went wrong. Please try again.')
  })

  it('maps auth/JWT errors', () => {
    expect(getFriendlyErrorMessage('jwt malformed')).toContain('logged in')
    expect(getFriendlyErrorMessage('unauthorized access')).toContain('logged in')
  })

  it('maps permission errors', () => {
    expect(getFriendlyErrorMessage('permission denied')).toContain('permission')
    expect(getFriendlyErrorMessage('forbidden resource')).toContain('permission')
  })

  it('maps same-user errors', () => {
    expect(getFriendlyErrorMessage('same user cannot trade')).toContain("can't trade with yourself")
  })

  it('maps duplicate proposal errors', () => {
    expect(getFriendlyErrorMessage('already pending proposal')).toContain('pending trade proposal')
  })

  it('maps unavailable item errors', () => {
    expect(getFriendlyErrorMessage('item is no longer available')).toContain('no longer available')
  })

  it('maps expired proposal errors', () => {
    expect(getFriendlyErrorMessage('this proposal has expired')).toContain('expired')
  })

  it('maps already-resolved errors', () => {
    expect(getFriendlyErrorMessage('already accepted')).toContain('already been resolved')
  })

  it('maps empty offer errors', () => {
    expect(getFriendlyErrorMessage('no items selected')).toContain('at least one item')
  })

  it('maps exchange not found errors', () => {
    expect(getFriendlyErrorMessage('exchange not found')).toContain('could not be found')
  })

  it('maps initiator-only errors', () => {
    expect(getFriendlyErrorMessage('initiator only can cancel')).toContain('person who created')
  })

  it('maps network/fetch errors', () => {
    expect(getFriendlyErrorMessage('fetch failed: ECONNREFUSED')).toContain('Connection error')
    expect(getFriendlyErrorMessage('network timeout')).toContain('Connection error')
  })

  it('maps rate limit errors', () => {
    expect(getFriendlyErrorMessage('rate limit exceeded')).toContain('Too many requests')
    expect(getFriendlyErrorMessage('too many requests')).toContain('Too many requests')
  })

  it('maps database constraint violations', () => {
    expect(getFriendlyErrorMessage('violates unique constraint')).toContain('conflicts')
    expect(getFriendlyErrorMessage('unique violation on table')).toContain('conflicts')
  })

  it('maps internal server errors', () => {
    expect(getFriendlyErrorMessage('internal server error')).toContain('our end')
  })

  it('returns short readable messages as-is', () => {
    const msg = 'Username already taken'
    expect(getFriendlyErrorMessage(msg)).toBe(msg)
  })

  it('falls back for long stack traces', () => {
    const stackTrace =
      'TypeError: Cannot read property at Object.fn (file.js:123:45) at step (/app/node_modules/tslib/tslib.js:144:27) at Object.<anonymous> (/app/src/lib/utils.ts:10:5) long enough to exceed limit'
    expect(getFriendlyErrorMessage(stackTrace)).toBe('Something went wrong. Please try again.')
  })
})
