import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useExchangeActions } from './use-exchange-actions'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockAcceptExchange = vi.fn()
const mockRejectExchange = vi.fn()
const mockCancelExchange = vi.fn()
const mockCompleteExchange = vi.fn()

vi.mock('@/app/actions/exchange', () => ({
  acceptExchange: (...args: unknown[]) => mockAcceptExchange(...args),
  rejectExchange: (...args: unknown[]) => mockRejectExchange(...args),
  cancelExchange: (...args: unknown[]) => mockCancelExchange(...args),
  completeExchange: (...args: unknown[]) => mockCompleteExchange(...args),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup(onSuccess = vi.fn().mockResolvedValue(undefined)) {
  return renderHook(() => useExchangeActions('user-1', onSuccess))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useExchangeActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts with actionLoading as null', () => {
      const { result } = setup()
      expect(result.current.actionLoading).toBeNull()
    })
  })

  describe('handleAccept', () => {
    it('calls acceptExchange with correct payload', async () => {
      mockAcceptExchange.mockResolvedValue({ success: true })
      const onSuccess = vi.fn().mockResolvedValue(undefined)
      const { result } = setup(onSuccess)

      await act(async () => {
        await result.current.handleAccept('ex-1')
      })

      expect(mockAcceptExchange).toHaveBeenCalledWith({
        exchange_id: 'ex-1',
        accepting_user_id: 'user-1',
      })
    })

    it('clears actionLoading after success', async () => {
      mockAcceptExchange.mockResolvedValue({ success: true })
      const { result } = setup()

      await act(async () => {
        await result.current.handleAccept('ex-1')
      })

      expect(result.current.actionLoading).toBeNull()
    })

    it('calls onSuccess callback after successful accept', async () => {
      mockAcceptExchange.mockResolvedValue({ success: true })
      const onSuccess = vi.fn().mockResolvedValue(undefined)
      const { result } = setup(onSuccess)

      await act(async () => {
        await result.current.handleAccept('ex-1')
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('shows success toast on accept', async () => {
      mockAcceptExchange.mockResolvedValue({ success: true })
      const { result } = setup()

      await act(async () => {
        await result.current.handleAccept('ex-1')
      })

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.stringContaining('accepted') })
      )
    })

    it('shows destructive toast and does not call onSuccess on failure', async () => {
      mockAcceptExchange.mockResolvedValue({
        success: false,
        error: 'item is no longer available',
      })
      const onSuccess = vi.fn()
      const { result } = setup(onSuccess)

      await act(async () => {
        await result.current.handleAccept('ex-1')
      })

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' })
      )
      expect(onSuccess).not.toHaveBeenCalled()
    })

    it('shows connection error toast when network throws', async () => {
      mockAcceptExchange.mockRejectedValue(new Error('fetch failed'))
      const { result } = setup()

      await act(async () => {
        await result.current.handleAccept('ex-1')
      })

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Connection error' })
      )
    })

    it('clears actionLoading even when action fails', async () => {
      mockAcceptExchange.mockResolvedValue({ success: false, error: 'forbidden' })
      const { result } = setup()

      await act(async () => {
        await result.current.handleAccept('ex-1')
      })

      expect(result.current.actionLoading).toBeNull()
    })
  })

  describe('handleReject', () => {
    it('calls rejectExchange with correct payload', async () => {
      mockRejectExchange.mockResolvedValue({ success: true })
      const { result } = setup()

      await act(async () => {
        await result.current.handleReject('ex-2')
      })

      expect(mockRejectExchange).toHaveBeenCalledWith({
        exchange_id: 'ex-2',
        rejecting_user_id: 'user-1',
      })
    })

    it('calls onSuccess and clears loading on success', async () => {
      mockRejectExchange.mockResolvedValue({ success: true })
      const onSuccess = vi.fn().mockResolvedValue(undefined)
      const { result } = setup(onSuccess)

      await act(async () => {
        await result.current.handleReject('ex-2')
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(result.current.actionLoading).toBeNull()
    })
  })

  describe('handleCancel', () => {
    it('calls cancelExchange with correct payload', async () => {
      mockCancelExchange.mockResolvedValue({ success: true })
      const { result } = setup()

      await act(async () => {
        await result.current.handleCancel('ex-3')
      })

      expect(mockCancelExchange).toHaveBeenCalledWith({
        exchange_id: 'ex-3',
        actor_user_id: 'user-1',
      })
    })

    it('calls onSuccess on success', async () => {
      mockCancelExchange.mockResolvedValue({ success: true })
      const onSuccess = vi.fn().mockResolvedValue(undefined)
      const { result } = setup(onSuccess)

      await act(async () => {
        await result.current.handleCancel('ex-3')
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  describe('handleComplete', () => {
    it('calls completeExchange with correct payload', async () => {
      mockCompleteExchange.mockResolvedValue({ success: true })
      const { result } = setup()

      await act(async () => {
        await result.current.handleComplete('ex-4')
      })

      expect(mockCompleteExchange).toHaveBeenCalledWith({
        exchange_id: 'ex-4',
        completing_user_id: 'user-1',
      })
    })

    it('calls onSuccess on success', async () => {
      mockCompleteExchange.mockResolvedValue({ success: true })
      const onSuccess = vi.fn().mockResolvedValue(undefined)
      const { result } = setup(onSuccess)

      await act(async () => {
        await result.current.handleComplete('ex-4')
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  describe('concurrent action prevention', () => {
    it('sets actionLoading to the exchange ID while action is in flight', async () => {
      let resolveAccept!: (v: unknown) => void
      mockAcceptExchange.mockReturnValue(
        new Promise((resolve) => {
          resolveAccept = resolve
        })
      )
      const { result } = setup()

      act(() => {
        result.current.handleAccept('ex-5')
      })

      await waitFor(() => {
        expect(result.current.actionLoading).toBe('ex-5')
      })

      await act(async () => {
        resolveAccept({ success: true })
      })

      await waitFor(() => {
        expect(result.current.actionLoading).toBeNull()
      })
    })
  })
})
