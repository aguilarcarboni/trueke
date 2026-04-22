import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('joins multiple class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('skips falsy values', () => {
    expect(cn('foo', false as never, undefined, null as never, 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting Tailwind utility classes (last wins)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('returns empty string with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('handles conditional class objects', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe('text-red-500')
  })

  it('merges conflicting background classes', () => {
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
  })

  it('preserves non-conflicting classes', () => {
    const result = cn('flex', 'items-center', 'gap-2')
    expect(result).toBe('flex items-center gap-2')
  })
})
