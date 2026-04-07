import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ExchangeActionButtons } from './exchange-action-buttons'

const BASE_PROPS = {
  exchangeId: 'ex-1',
  initiatorId: 'user-initiator',
  currentUserId: 'user-target',
  isLoading: false,
  onAccept: vi.fn().mockResolvedValue(undefined),
  onReject: vi.fn().mockResolvedValue(undefined),
  onCancel: vi.fn().mockResolvedValue(undefined),
  onComplete: vi.fn().mockResolvedValue(undefined),
}

describe('ExchangeActionButtons — terminal statuses render nothing', () => {
  it.each(['completed', 'rejected', 'expired', 'cancelled'] as const)(
    'returns null for status "%s"',
    (status) => {
      const { container } = render(
        <ExchangeActionButtons {...BASE_PROPS} status={status} />
      )
      expect(container).toBeEmptyDOMElement()
    }
  )
})

describe('ExchangeActionButtons — pending (target user)', () => {
  it('shows Accept button for the target user on a pending exchange', () => {
    render(<ExchangeActionButtons {...BASE_PROPS} status="pending" />)
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
  })

  it('shows Reject button for the target user on a pending exchange', () => {
    render(<ExchangeActionButtons {...BASE_PROPS} status="pending" />)
    expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
  })

  it('does not show a Cancel button for the target user', () => {
    render(<ExchangeActionButtons {...BASE_PROPS} status="pending" />)
    expect(screen.queryByRole('button', { name: /^cancel/i })).not.toBeInTheDocument()
  })

  it('clicking Accept opens confirmation dialog', () => {
    render(<ExchangeActionButtons {...BASE_PROPS} status="pending" />)
    fireEvent.click(screen.getByRole('button', { name: /accept/i }))
    expect(screen.getByRole('heading', { name: /accept this trade/i })).toBeInTheDocument()
  })

  it('clicking Reject opens a destructive confirmation dialog', () => {
    render(<ExchangeActionButtons {...BASE_PROPS} status="pending" />)
    fireEvent.click(screen.getByRole('button', { name: /reject/i }))
    expect(screen.getByRole('heading', { name: /reject this trade/i })).toBeInTheDocument()
  })
})

describe('ExchangeActionButtons — pending (initiator user)', () => {
  const initiatorProps = {
    ...BASE_PROPS,
    currentUserId: 'user-initiator', // same as initiatorId
    status: 'pending' as const,
  }

  it('shows Cancel button for the initiator', () => {
    render(<ExchangeActionButtons {...initiatorProps} />)
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('does not show Accept or Reject for the initiator', () => {
    render(<ExchangeActionButtons {...initiatorProps} />)
    expect(screen.queryByRole('button', { name: /accept/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument()
  })

  it('clicking Cancel opens confirmation dialog', () => {
    render(<ExchangeActionButtons {...initiatorProps} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByText(/cancel your proposal/i)).toBeInTheDocument()
  })
})

describe('ExchangeActionButtons — accepted exchange', () => {
  const acceptedProps = { ...BASE_PROPS, status: 'accepted' as const }

  it('shows Mark complete button', () => {
    render(<ExchangeActionButtons {...acceptedProps} />)
    expect(screen.getByRole('button', { name: /mark complete/i })).toBeInTheDocument()
  })

  it('shows Cancel trade button', () => {
    render(<ExchangeActionButtons {...acceptedProps} />)
    expect(screen.getByRole('button', { name: /cancel trade/i })).toBeInTheDocument()
  })

  it('clicking Cancel trade opens the confirmation dialog', () => {
    render(<ExchangeActionButtons {...acceptedProps} />)
    fireEvent.click(screen.getByRole('button', { name: /cancel trade/i }))
    expect(screen.getByText(/cancel this accepted trade/i)).toBeInTheDocument()
  })

  it('clicking Mark complete opens the confirmation dialog', () => {
    render(<ExchangeActionButtons {...acceptedProps} />)
    fireEvent.click(screen.getByRole('button', { name: /mark complete/i }))
    expect(screen.getByText(/mark trade as complete/i)).toBeInTheDocument()
  })

  it('buttons are disabled while isLoading', () => {
    render(<ExchangeActionButtons {...acceptedProps} isLoading />)
    screen.getAllByRole('button').forEach((btn) => expect(btn).toBeDisabled())
  })
})
