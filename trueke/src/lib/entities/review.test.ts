import { describe, it, expect } from 'vitest'
import {
  isValidRating,
  isValidComment,
  getConditionRatingLabel,
  getConditionRatingStyle,
  ITEM_CONDITION_RATING_LABELS,
  ITEM_CONDITION_RATING_STYLES,
  ITEM_CONDITION_RATINGS,
  REVIEW_COMMENT_MAX_LENGTH,
} from './review'

// ── isValidRating ─────────────────────────────────────────────────────────────

describe('isValidRating', () => {
  it('returns true for valid ratings 1–5', () => {
    expect(isValidRating(1)).toBe(true)
    expect(isValidRating(2)).toBe(true)
    expect(isValidRating(3)).toBe(true)
    expect(isValidRating(4)).toBe(true)
    expect(isValidRating(5)).toBe(true)
  })

  it('returns false for 0', () => {
    expect(isValidRating(0)).toBe(false)
  })

  it('returns false for negative numbers', () => {
    expect(isValidRating(-1)).toBe(false)
  })

  it('returns false for numbers above 5', () => {
    expect(isValidRating(6)).toBe(false)
  })

  it('returns false for fractional numbers', () => {
    expect(isValidRating(3.5)).toBe(false)
    expect(isValidRating(1.1)).toBe(false)
  })

  it('returns false for NaN', () => {
    expect(isValidRating(NaN)).toBe(false)
  })
})

// ── isValidComment ────────────────────────────────────────────────────────────

describe('isValidComment', () => {
  it('returns true for undefined (optional field)', () => {
    expect(isValidComment(undefined)).toBe(true)
  })

  it('returns true for empty string', () => {
    expect(isValidComment('')).toBe(true)
  })

  it('returns true for a short comment', () => {
    expect(isValidComment('Great trader!')).toBe(true)
  })

  it('returns true for comment at max length', () => {
    const comment = 'a'.repeat(REVIEW_COMMENT_MAX_LENGTH)
    expect(isValidComment(comment)).toBe(true)
  })

  it('returns false for comment exceeding max length', () => {
    const comment = 'a'.repeat(REVIEW_COMMENT_MAX_LENGTH + 1)
    expect(isValidComment(comment)).toBe(false)
  })
})

// ── getConditionRatingLabel ───────────────────────────────────────────────────

describe('getConditionRatingLabel', () => {
  it('returns correct label for each known rating', () => {
    expect(getConditionRatingLabel('like_new')).toBe('Like New')
    expect(getConditionRatingLabel('good')).toBe('Good')
    expect(getConditionRatingLabel('acceptable')).toBe('Acceptable')
    expect(getConditionRatingLabel('bad')).toBe('Bad')
  })

  it('returns the raw string for unknown ratings', () => {
    expect(getConditionRatingLabel('unknown')).toBe('unknown')
  })
})

// ── getConditionRatingStyle ───────────────────────────────────────────────────

describe('getConditionRatingStyle', () => {
  it('returns a non-empty style for each known rating', () => {
    for (const rating of ITEM_CONDITION_RATINGS) {
      expect(getConditionRatingStyle(rating)).toBeTruthy()
    }
  })

  it('returns empty string for unknown ratings', () => {
    expect(getConditionRatingStyle('nonsense')).toBe('')
  })
})

// ── Constants ─────────────────────────────────────────────────────────────────

describe('ITEM_CONDITION_RATINGS', () => {
  it('contains exactly 4 condition ratings', () => {
    expect(ITEM_CONDITION_RATINGS).toHaveLength(4)
  })

  it('has a label for every rating', () => {
    for (const rating of ITEM_CONDITION_RATINGS) {
      expect(ITEM_CONDITION_RATING_LABELS[rating]).toBeDefined()
    }
  })

  it('has a style for every rating', () => {
    for (const rating of ITEM_CONDITION_RATINGS) {
      expect(ITEM_CONDITION_RATING_STYLES[rating]).toBeDefined()
    }
  })
})

describe('REVIEW_COMMENT_MAX_LENGTH', () => {
  it('is a positive number', () => {
    expect(REVIEW_COMMENT_MAX_LENGTH).toBeGreaterThan(0)
  })
})
