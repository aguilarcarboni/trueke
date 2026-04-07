import { describe, it, expect } from 'vitest'
import { EMAIL_PATTERN } from './email'

describe('EMAIL_PATTERN', () => {
  it.each([
    'user@domain.com',
    'user+tag@sub.domain.co',
    'a@b.io',
    'firstname.lastname@company.org',
    'user123@domain.net',
  ])('accepts valid email: %s', (email) => {
    expect(EMAIL_PATTERN.test(email)).toBe(true)
  })

  it.each([
    ['empty string', ''],
    ['no at sign', 'notanemail'],
    ['starts with @', '@domain.com'],
    ['no domain', 'user@'],
    ['no TLD', 'user@domain'],
    ['space before @', 'user @domain.com'],
    ['space after @', 'user@ domain.com'],
    ['double @', 'user@@domain.com'],
  ])('rejects invalid email: %s', (_label, email) => {
    expect(EMAIL_PATTERN.test(email)).toBe(false)
  })
})
