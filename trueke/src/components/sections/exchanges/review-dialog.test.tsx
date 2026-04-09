import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ReviewDialog } from './review-dialog'
import type { ExchangeItem } from '@/lib/entities/exchange'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockSubmitReview = vi.fn()
vi.mock('@/app/actions/review', () => ({
  submitReview: (...args: unknown[]) => mockSubmitReview(...args),
}))

// ── Test Data ─────────────────────────────────────────────────────────────────

const receivedItems: ExchangeItem[] = [
  {
    item_id: 'item-1',
    title: 'Vintage Guitar',
    condition: 'used',
    owner_id: 'other-user',
    images: ['https://example.com/guitar.jpg'],
  },
  {
    item_id: 'item-2',
    title: 'Comic Book Collection',
    condition: 'like new',
    owner_id: 'other-user',
    images: [],
  },
]

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  exchangeId: 'exchange-1',
  currentUserId: 'user-1',
  otherUserId: 'other-user',
  otherUserName: 'AliceTrader',
  receivedItems,
  onSuccess: vi.fn(),
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ReviewDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the dialog with correct title', () => {
    render(<ReviewDialog {...defaultProps} />)
    expect(screen.getByText('Review Trade')).toBeInTheDocument()
  })

  it('displays the other user name in description', () => {
    render(<ReviewDialog {...defaultProps} />)
    expect(screen.getByText('AliceTrader')).toBeInTheDocument()
  })

  it('shows all received items for condition review', () => {
    render(<ReviewDialog {...defaultProps} />)
    expect(screen.getByText('Vintage Guitar')).toBeInTheDocument()
    expect(screen.getByText('Comic Book Collection')).toBeInTheDocument()
  })

  it('shows condition rating options for each item', () => {
    render(<ReviewDialog {...defaultProps} />)
    // Each item should have 4 condition options
    const likeNewBadges = screen.getAllByText('Like New')
    const goodBadges = screen.getAllByText('Good')
    const acceptableBadges = screen.getAllByText('Acceptable')
    const badBadges = screen.getAllByText('Bad')

    expect(likeNewBadges.length).toBe(2)
    expect(goodBadges.length).toBe(2)
    expect(acceptableBadges.length).toBe(2)
    expect(badBadges.length).toBe(2)
  })

  it('renders 5 star buttons for user rating', () => {
    render(<ReviewDialog {...defaultProps} />)
    const starButtons = screen.getAllByRole('button', { name: /Rate \d star/ })
    expect(starButtons.length).toBe(5)
  })

  it('submit button is disabled when no rating or condition selected', () => {
    render(<ReviewDialog {...defaultProps} />)
    const submitBtn = screen.getByRole('button', { name: /Submit Review/ })
    expect(submitBtn).toBeDisabled()
  })

  it('calls submitReview with correct payload on submit', async () => {
    mockSubmitReview.mockResolvedValue({ success: true })
    render(<ReviewDialog {...defaultProps} />)

    // Click 4th star
    const starButtons = screen.getAllByRole('button', { name: /Rate \d star/ })
    fireEvent.click(starButtons[3]) // 4 stars

    // Select condition for each item
    const goodBadges = screen.getAllByText('Good')
    fireEvent.click(goodBadges[0])
    fireEvent.click(goodBadges[1])

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Submit Review/ })
    expect(submitBtn).not.toBeDisabled()
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockSubmitReview).toHaveBeenCalledWith({
        exchange_id: 'exchange-1',
        reviewer_user_id: 'user-1',
        reviewed_user_id: 'other-user',
        user_rating: 4,
        user_comment: undefined,
        item_reviews: [
          { item_id: 'item-1', condition_rating: 'good', comment: undefined },
          { item_id: 'item-2', condition_rating: 'good', comment: undefined },
        ],
      })
    })
  })

  it('shows success toast on successful submission', async () => {
    mockSubmitReview.mockResolvedValue({ success: true })
    render(<ReviewDialog {...defaultProps} />)

    // Quick-fill: rate 5 stars, select "Acceptable" for all items
    const starButtons = screen.getAllByRole('button', { name: /Rate \d star/ })
    fireEvent.click(starButtons[4])

    const acceptableBadges = screen.getAllByText('Acceptable')
    fireEvent.click(acceptableBadges[0])
    fireEvent.click(acceptableBadges[1])

    fireEvent.click(screen.getByRole('button', { name: /Submit Review/ }))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Review submitted!' })
      )
    })
  })

  it('shows error toast on failed submission', async () => {
    mockSubmitReview.mockResolvedValue({
      success: false,
      error: 'You have already submitted a review',
    })
    render(<ReviewDialog {...defaultProps} />)

    const starButtons = screen.getAllByRole('button', { name: /Rate \d star/ })
    fireEvent.click(starButtons[2])

    const badBadges = screen.getAllByText('Bad')
    fireEvent.click(badBadges[0])
    fireEvent.click(badBadges[1])

    fireEvent.click(screen.getByRole('button', { name: /Submit Review/ }))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: 'destructive' })
      )
    })
  })

  it('calls onSuccess after successful submit', async () => {
    mockSubmitReview.mockResolvedValue({ success: true })
    render(<ReviewDialog {...defaultProps} />)

    const starButtons = screen.getAllByRole('button', { name: /Rate \d star/ })
    fireEvent.click(starButtons[0])

    const likeNewBadges = screen.getAllByText('Like New')
    fireEvent.click(likeNewBadges[0])
    fireEvent.click(likeNewBadges[1])

    fireEvent.click(screen.getByRole('button', { name: /Submit Review/ }))

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('shows character count for user comment', () => {
    render(<ReviewDialog {...defaultProps} />)
    expect(screen.getByText('0/500')).toBeInTheDocument()
  })

  it('does not render when open is false', () => {
    render(<ReviewDialog {...defaultProps} open={false} />)
    expect(screen.queryByText('Review Trade')).not.toBeInTheDocument()
  })
})
