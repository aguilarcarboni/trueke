import { describe, it, expect } from 'vitest'
import { generateSixDigitCode } from './verification-code'

describe('generateSixDigitCode', () => {
  it('generates a string of exactly 6 characters', () => {
    expect(generateSixDigitCode()).toHaveLength(6)
  })

  it('contains only digit characters (0-9)', () => {
    expect(generateSixDigitCode()).toMatch(/^\d{6}$/)
  })

  it('generates different codes across 100 calls (randomness check)', () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateSixDigitCode()))
    // With 10^6 possible values, 100 calls producing >50 unique results is near-certain
    expect(codes.size).toBeGreaterThan(50)
  })

  it('never generates a code outside 000000–999999', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateSixDigitCode()
      const n = parseInt(code, 10)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(999999)
    }
  })
})
