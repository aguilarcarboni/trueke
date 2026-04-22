import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useExchangeData } from './use-exchange-data'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockGetUserExchangesEnriched = vi.fn()
const mockGetAvailableItems = vi.fn()
vi.mock('@/app/actions/exchange', () => ({
  getUserExchangesEnriched: (...args: unknown[]) =>
    mockGetUserExchangesEnriched(...args),
  getAvailableItems: (...args: unknown[]) => mockGetAvailableItems(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FAKE_EXCHANGES = [
  { exchange_id: 'ex-1', status: 'pending', offered_items: [], requested_items: [] },
]
const FAKE_ITEMS = [{ item_id: 'item-1', title: 'Laptop', status: 'active' }]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useExchangeData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUserExchangesEnriched.mockResolvedValue({
      success: true,
      data: FAKE_EXCHANGES,
    })
    mockGetAvailableItems.mockResolvedValue({
      success: true,
      data: FAKE_ITEMS,
    })
  })

  it('starts with isLoading=true and empty arrays', () => {
    // Delay resolution so we can observe loading state
    mockGetUserExchangesEnriched.mockReturnValue(new Promise(() => {}))
    mockGetAvailableItems.mockReturnValue(new Promise(() => {}))

    const { result } = renderHook(() => useExchangeData('user-1'))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.exchanges).toEqual([])
    expect(result.current.availableItems).toEqual([])
  })

  it('populates exchanges and availableItems after successful fetch', async () => {
    const { result } = renderHook(() => useExchangeData('user-1'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.exchanges).toEqual(FAKE_EXCHANGES)
    expect(result.current.availableItems).toEqual(FAKE_ITEMS)
  })

  it('fetches both resources in parallel on mount', async () => {
    renderHook(() => useExchangeData('user-1'))

    await waitFor(() => {
      expect(mockGetUserExchangesEnriched).toHaveBeenCalledTimes(1)
      expect(mockGetAvailableItems).toHaveBeenCalledTimes(1)
    })
    expect(mockGetUserExchangesEnriched).toHaveBeenCalledWith('user-1')
    expect(mockGetAvailableItems).toHaveBeenCalledWith('user-1')
  })

  it('shows a toast when exchanges fetch fails', async () => {
    mockGetUserExchangesEnriched.mockResolvedValue({
      success: false,
      error: 'unauthorized',
    })

    renderHook(() => useExchangeData('user-1'))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' })
      )
    })
  })

  it('shows a toast when availableItems fetch fails', async () => {
    mockGetAvailableItems.mockResolvedValue({
      success: false,
      error: 'internal server error',
    })

    renderHook(() => useExchangeData('user-1'))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' })
      )
    })
  })

  it('shows a connection error toast on network exception', async () => {
    mockGetUserExchangesEnriched.mockRejectedValue(new Error('Network error'))

    renderHook(() => useExchangeData('user-1'))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Connection error' })
      )
    })
  })

  it('reloadExchanges only re-fetches exchanges, not availableItems', async () => {
    const { result } = renderHook(() => useExchangeData('user-1'))

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const callCountBefore = mockGetAvailableItems.mock.calls.length

    const UPDATED_EXCHANGES = [
      ...FAKE_EXCHANGES,
      { exchange_id: 'ex-2', status: 'accepted', offered_items: [], requested_items: [] },
    ]
    mockGetUserExchangesEnriched.mockResolvedValue({
      success: true,
      data: UPDATED_EXCHANGES,
    })

    await act(async () => {
      await result.current.reloadExchanges()
    })

    expect(mockGetAvailableItems.mock.calls.length).toBe(callCountBefore)
    expect(result.current.exchanges).toEqual(UPDATED_EXCHANGES)
  })
})
