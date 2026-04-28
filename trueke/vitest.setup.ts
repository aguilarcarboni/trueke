import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// ── Radix UI polyfills ────────────────────────────────────────────────────────

if (typeof window !== 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  // Pointer capture APIs required by Radix interactive components
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  window.HTMLElement.prototype.releasePointerCapture = vi.fn()
  window.HTMLElement.prototype.hasPointerCapture = vi.fn() as never
  window.HTMLElement.prototype.setPointerCapture = vi.fn()

  // matchMedia stub (overridden per-test in use-mobile tests)
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
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
