import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ExchangeStatusBadge } from './exchange-status-badge'
import {
  EXCHANGE_STATUS_LABELS,
  type ExchangeStatus,
} from '@/lib/entities/exchange'

const ALL_STATUSES = Object.keys(EXCHANGE_STATUS_LABELS) as ExchangeStatus[]

describe('ExchangeStatusBadge', () => {
  it.each(ALL_STATUSES)('renders the correct label for status "%s"', (status) => {
    render(<ExchangeStatusBadge status={status} />)
    expect(
      screen.getByText(EXCHANGE_STATUS_LABELS[status])
    ).toBeInTheDocument()
  })

  it('applies a custom className', () => {
    const { container } = render(
      <ExchangeStatusBadge status="pending" className="test-class" />
    )
    const badge = container.firstChild as HTMLElement
    expect(badge).toHaveClass('test-class')
  })

  it('the pending badge does not use destructive classes', () => {
    const { container } = render(<ExchangeStatusBadge status="pending" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).not.toContain('text-destructive')
  })

  it('the rejected badge uses a destructive style', () => {
    const { container } = render(<ExchangeStatusBadge status="rejected" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('destructive')
  })

  it('the completed badge uses a success style', () => {
    const { container } = render(<ExchangeStatusBadge status="completed" />)
    const badge = container.firstChild as HTMLElement
    expect(badge.className).toContain('success')
  })
})
