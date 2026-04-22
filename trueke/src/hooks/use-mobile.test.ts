import { describe, it, expect, afterEach } from 'vitest'
import { vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useIsMobile } from './use-mobile'

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

describe('useIsMobile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when window.innerWidth is below 768', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 })
    mockMatchMedia(true)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false when window.innerWidth is exactly 768', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 768 })
    mockMatchMedia(false)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns false when window.innerWidth is above 768', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1280 })
    mockMatchMedia(false)

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('updates when matchMedia onChange fires with smaller width', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 1024 })
    mockMatchMedia(false)

    let changeHandler: (() => void) | null = null
    const mockMql = {
      matches: false,
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_event: string, handler: () => void) => {
        changeHandler = handler
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockReturnValue(mockMql),
    })

    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    // Simulate resize to mobile
    Object.defineProperty(window, 'innerWidth', { writable: true, value: 375 })
    await act(async () => {
      changeHandler?.()
    })

    expect(result.current).toBe(true)
  })
})
