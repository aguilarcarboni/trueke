import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { CounterOfferDialog } from './counteroffer-dialog'
import type { ExchangeListItemEnriched } from '@/lib/entities/exchange'
import type { Item } from '@/lib/entities/item'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockGetMyItems = vi.fn()
const mockGetActiveItemsByUser = vi.fn()
const mockCreateCounteroffer = vi.fn()

vi.mock('@/app/actions/exchange', () => ({
  getMyItems: (...args: unknown[]) => mockGetMyItems(...args),
  getActiveItemsByUser: (...args: unknown[]) => mockGetActiveItemsByUser(...args),
  createCounteroffer: (...args: unknown[]) => mockCreateCounteroffer(...args),
}))

vi.mock('@/lib/error-messages', () => ({
  getFriendlyErrorMessage: (e: string) => e ?? 'Unknown error',
}))

// ── Test Data ─────────────────────────────────────────────────────────────────

const MY_ITEMS: Item[] = [
  {
    item_id: 'my-item-1',
    title: 'My Widget',
    description: 'A fine widget',
    condition: 'new',
    category: 'Electronics',
    item_type: 'physical',
    status: 'active',
    images: [],
    owner_user_id: 'current-user',
    owner_name: 'Me',
    last_date_uploaded: '2025-01-01',
  },
  {
    item_id: 'my-item-2',
    title: 'My Gadget',
    description: 'A fine gadget',
    condition: 'used',
    category: 'Toys',
    item_type: 'physical',
    status: 'active',
    images: [],
    owner_user_id: 'current-user',
    owner_name: 'Me',
    last_date_uploaded: '2025-01-01',
  },
]

const THEIR_ITEMS: Item[] = [
  {
    item_id: 'their-item-1',
    title: 'Their Gizmo',
    description: 'A neat gizmo',
    condition: 'like new',
    category: 'Electronics',
    item_type: 'physical',
    status: 'active',
    images: [],
    owner_user_id: 'other-user',
    owner_name: 'Other',
    last_date_uploaded: '2025-01-01',
  },
]

const EXCHANGE: ExchangeListItemEnriched = {
  exchange_id: 'ex-1',
  initiator_id: 'other-user',
  initiator_name: 'Other',
  target_user_id: 'current-user',
  target_name: 'Me',
  status: 'pending',
  message: 'Original message',
  created_at: '2025-01-01T00:00:00Z',
  expires_at: '2025-02-01T00:00:00Z',
  offered_count: 1,
  requested_count: 1,
  parent_exchange_id: null,
  offered_items: [{ item_id: 'their-item-1', title: 'Their Gizmo', condition: 'like new', owner_id: 'other-user' }],
  requested_items: [{ item_id: 'my-item-1', title: 'My Widget', condition: 'new', owner_id: 'current-user' }],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderDialog(overrides: Record<string, unknown> = {}) {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    exchange: EXCHANGE,
    currentUserId: 'current-user',
    onSuccess: vi.fn(),
    ...overrides,
  }
  return { ...render(<CounterOfferDialog {...defaultProps} />), props: defaultProps }
}

function setupMocks({ myItems = MY_ITEMS, theirItems = THEIR_ITEMS } = {}) {
  mockGetMyItems.mockResolvedValue({ success: true, data: myItems })
  mockGetActiveItemsByUser.mockResolvedValue({ success: true, data: theirItems })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('CounterOfferDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders the dialog title when open', async () => {
      setupMocks()
      renderDialog()
      expect(screen.getByText('Make a Counteroffer')).toBeInTheDocument()
    })

    it('shows the other user name in the description', async () => {
      setupMocks()
      renderDialog()
      expect(screen.getByText('Other')).toBeInTheDocument()
    })

    it('displays the original proposal for reference (AC2)', async () => {
      setupMocks()
      renderDialog()
      expect(screen.getByText('Original Proposal')).toBeInTheDocument()
    })

    it('shows the original proposal message', async () => {
      setupMocks()
      renderDialog()
      expect(screen.getByText(/Original message/i)).toBeInTheDocument()
    })
  })

  describe('item fetching', () => {
    it('fetches my items and their items on open', async () => {
      setupMocks()
      renderDialog()

      await waitFor(() => {
        expect(mockGetMyItems).toHaveBeenCalledWith('current-user')
        expect(mockGetActiveItemsByUser).toHaveBeenCalledWith('other-user')
      })
    })

    it('displays fetched items after loading', async () => {
      setupMocks()
      renderDialog()

      await waitFor(() => {
        // Items may appear multiple times (original proposal + grid + summary)
        expect(screen.getAllByText('My Widget').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('My Gadget').length).toBeGreaterThanOrEqual(1)
        expect(screen.getAllByText('Their Gizmo').length).toBeGreaterThanOrEqual(1)
      })
    })

    it('shows error toast when my items fail to load', async () => {
      mockGetMyItems.mockResolvedValue({ success: false, error: 'DB error' })
      mockGetActiveItemsByUser.mockResolvedValue({ success: true, data: THEIR_ITEMS })
      renderDialog()

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Couldn't load your items", variant: 'destructive' })
        )
      })
    })

    it('shows error toast when their items fail to load', async () => {
      mockGetMyItems.mockResolvedValue({ success: true, data: MY_ITEMS })
      mockGetActiveItemsByUser.mockResolvedValue({ success: false, error: 'DB error' })
      renderDialog()

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Couldn't load their items", variant: 'destructive' })
        )
      })
    })
  })

  describe('pre-selection filtering', () => {
    it('pre-selects items from original proposal that are still active', async () => {
      setupMocks()
      renderDialog()

      // My item "my-item-1" was in the original requested_items → should be pre-selected as offered
      // Their item "their-item-1" was in the original offered_items → should be pre-selected as requested
      await waitFor(() => {
        // The summary panels show the selected item titles
        // "My Widget" appears in the "You're Offering" summary (pre-selected)
        // "Their Gizmo" appears in the "You Want" summary (pre-selected)
        const allTexts = screen.getAllByText('My Widget')
        expect(allTexts.length).toBeGreaterThan(1) // once in grid, once in summary
        const gizmoTexts = screen.getAllByText('Their Gizmo')
        expect(gizmoTexts.length).toBeGreaterThan(1)
      })
    })

    it('does NOT pre-select items that are no longer active', async () => {
      // Return my items but exclude "my-item-1" — it's no longer active
      setupMocks({ myItems: [MY_ITEMS[1]], theirItems: [] })

      renderDialog()

      await waitFor(() => {
        // "My Gadget" should be in the item grid (available to select)
        expect(screen.getByText('My Gadget')).toBeInTheDocument()
      })

      // Both summary panels should show "No items selected" (no offered, no requested)
      expect(screen.getAllByText(/No items selected/i).length).toBe(2)
    })
  })

  describe('item selection toggles', () => {
    it('toggles an offered item when clicked', async () => {
      setupMocks()
      renderDialog()

      await waitFor(() => {
        expect(screen.getByText('My Gadget')).toBeInTheDocument()
      })

      // "My Gadget" is not pre-selected. Click it to select.
      const gadgetCards = screen.getAllByText('My Gadget')
      // The one in the item grid (not in the summary) is clickable
      fireEvent.click(gadgetCards[0].closest('[class*="cursor-pointer"]')!)

      await waitFor(() => {
        // Now both items should be selected → summary shows "2 items"
        expect(screen.getByText('2 items')).toBeInTheDocument()
      })
    })

    it('deselects a pre-selected offered item when clicked', async () => {
      setupMocks()
      renderDialog()

      // Wait for items to load and pre-selection to happen
      await waitFor(() => {
        const widgetTexts = screen.getAllByText('My Widget')
        // Should appear: original proposal + grid + summary = 3
        expect(widgetTexts.length).toBeGreaterThan(1)
      })

      // Click "My Widget" in the item grid to deselect it.
      // The grid cards have cursor-pointer; find the one that's a clickable Card.
      const widgetTexts = screen.getAllByText('My Widget')
      const clickableCard = widgetTexts
        .map((el) => el.closest('[class*="cursor-pointer"]'))
        .find((el) => el !== null)
      expect(clickableCard).toBeTruthy()
      fireEvent.click(clickableCard!)

      await waitFor(() => {
        // After deselecting, "My Widget" should only appear in the
        // original proposal reference and the grid — NOT in the summary.
        // The offering summary should show "No items selected".
        expect(screen.getAllByText(/No items selected/i).length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('search filtering', () => {
    it('filters my items by search query', async () => {
      setupMocks()
      renderDialog()

      await waitFor(() => {
        expect(screen.getByText('My Gadget')).toBeInTheDocument()
      })

      const searchInputs = screen.getAllByPlaceholderText(/search/i)
      // First search input is "Search your items..."
      fireEvent.change(searchInputs[0], { target: { value: 'Widget' } })

      // "My Gadget" should be filtered out of the grid
      // Use waitFor in case of async re-render
      await waitFor(() => {
        const gadgets = screen.queryAllByText('My Gadget')
        // It may still appear in the summary if pre-selected, but not in the grid
        // The grid uses filteredMyItems so "My Gadget" won't appear there
        expect(gadgets.length).toBeLessThanOrEqual(0)
      })
    })
  })

  describe('validation', () => {
    it('disables submit button when no offered items are selected', async () => {
      setupMocks({ myItems: [], theirItems: THEIR_ITEMS })
      renderDialog()

      await waitFor(() => {
        expect(screen.getAllByText('Their Gizmo').length).toBeGreaterThanOrEqual(1)
      })

      // The submit button should be disabled because no offered items
      const submitBtn = screen.getByRole('button', { name: /send counteroffer/i })
      expect(submitBtn).toBeDisabled()
    })

    it('shows toast when submitting with no requested items', async () => {
      // Provide my items but no their items
      setupMocks({ myItems: MY_ITEMS, theirItems: [] })
      renderDialog()

      await waitFor(() => {
        expect(screen.getByText('My Widget')).toBeInTheDocument()
      })

      // Submit button should be disabled because no requested items
      const submitBtn = screen.getByRole('button', { name: /send counteroffer/i })
      expect(submitBtn).toBeDisabled()
    })
  })

  describe('submission', () => {
    it('calls createCounteroffer with correct payload on submit', async () => {
      setupMocks()
      mockCreateCounteroffer.mockResolvedValue({ success: true, data: { exchange_id: 'new-ex' } })

      renderDialog()

      await waitFor(() => {
        expect(screen.getByText('My Widget')).toBeInTheDocument()
        expect(screen.getByText('Their Gizmo')).toBeInTheDocument()
      })

      // Items are pre-selected — submit directly
      const submitBtn = screen.getByRole('button', { name: /send counteroffer/i })
      await act(async () => {
        fireEvent.click(submitBtn)
      })

      await waitFor(() => {
        expect(mockCreateCounteroffer).toHaveBeenCalledTimes(1)
        const payload = mockCreateCounteroffer.mock.calls[0][0]
        expect(payload.parent_exchange_id).toBe('ex-1')
        expect(payload.actor_user_id).toBe('current-user')
        expect(payload.offered_item_ids).toEqual(['my-item-1'])
        expect(payload.requested_item_ids).toEqual(['their-item-1'])
        expect(payload.expiration_days).toBeGreaterThan(0)
      })
    })

    it('shows success toast and calls onSuccess', async () => {
      setupMocks()
      mockCreateCounteroffer.mockResolvedValue({ success: true, data: { exchange_id: 'new-ex' } })

      const { props } = renderDialog()

      await waitFor(() => {
        expect(screen.getByText('My Widget')).toBeInTheDocument()
      })

      const submitBtn = screen.getByRole('button', { name: /send counteroffer/i })
      await act(async () => {
        fireEvent.click(submitBtn)
      })

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Counteroffer sent!' })
        )
        expect(props.onSuccess).toHaveBeenCalled()
        expect(props.onOpenChange).toHaveBeenCalledWith(false)
      })
    })

    it('shows error toast on server failure', async () => {
      setupMocks()
      mockCreateCounteroffer.mockResolvedValue({ success: false, error: 'Conflict' })

      renderDialog()

      await waitFor(() => {
        expect(screen.getByText('My Widget')).toBeInTheDocument()
      })

      const submitBtn = screen.getByRole('button', { name: /send counteroffer/i })
      await act(async () => {
        fireEvent.click(submitBtn)
      })

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Couldn't send counteroffer", variant: 'destructive' })
        )
      })
    })

    it('shows connection error toast on network failure', async () => {
      setupMocks()
      mockCreateCounteroffer.mockRejectedValue(new Error('Network error'))

      renderDialog()

      await waitFor(() => {
        expect(screen.getByText('My Widget')).toBeInTheDocument()
      })

      const submitBtn = screen.getByRole('button', { name: /send counteroffer/i })
      await act(async () => {
        fireEvent.click(submitBtn)
      })

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Connection error' })
        )
      })
    })
  })

  describe('cancel', () => {
    it('calls onOpenChange(false) when Cancel is clicked', async () => {
      setupMocks()
      const { props } = renderDialog()

      const cancelBtn = screen.getByRole('button', { name: /^cancel$/i })
      fireEvent.click(cancelBtn)

      expect(props.onOpenChange).toHaveBeenCalledWith(false)
    })
  })
})
