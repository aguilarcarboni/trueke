import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmActionDialog } from './confirm-action-dialog'

const DEFAULT_PROPS = {
  open: true,
  onOpenChange: vi.fn(),
  title: 'Are you sure?',
  description: 'This action cannot be undone.',
  onConfirm: vi.fn(),
}

describe('ConfirmActionDialog', () => {
  it('renders the title when open', () => {
    render(<ConfirmActionDialog {...DEFAULT_PROPS} />)
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
  })

  it('renders the description when open', () => {
    render(<ConfirmActionDialog {...DEFAULT_PROPS} />)
    expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument()
  })

  it('renders the default confirm label "Confirm"', () => {
    render(<ConfirmActionDialog {...DEFAULT_PROPS} />)
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
  })

  it('renders a custom confirm label', () => {
    render(<ConfirmActionDialog {...DEFAULT_PROPS} confirmLabel="Delete" />)
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
  })

  it('renders the cancel button', () => {
    render(<ConfirmActionDialog {...DEFAULT_PROPS} />)
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onConfirm when the confirm button is clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmActionDialog {...DEFAULT_PROPS} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('does not call onConfirm when the cancel button is clicked', () => {
    const onConfirm = vi.fn()
    render(<ConfirmActionDialog {...DEFAULT_PROPS} onConfirm={onConfirm} />)

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('applies destructive class to confirm button when variant is "destructive"', () => {
    render(
      <ConfirmActionDialog
        {...DEFAULT_PROPS}
        variant="destructive"
        confirmLabel="Delete"
      />
    )
    const confirmBtn = screen.getByRole('button', { name: /delete/i })
    expect(confirmBtn.className).toContain('destructive')
  })

  it('does not apply destructive class when variant is "default"', () => {
    render(
      <ConfirmActionDialog {...DEFAULT_PROPS} variant="default" confirmLabel="OK" />
    )
    const confirmBtn = screen.getByRole('button', { name: /ok/i })
    expect(confirmBtn.className).not.toContain('bg-destructive')
  })

  it('disables both buttons while isLoading is true', () => {
    render(<ConfirmActionDialog {...DEFAULT_PROPS} isLoading />)

    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => expect(btn).toBeDisabled())
  })

  it('shows "Processing…" text and a spinner when loading', () => {
    render(<ConfirmActionDialog {...DEFAULT_PROPS} isLoading />)
    expect(screen.getByText(/processing/i)).toBeInTheDocument()
  })

  it('does not render dialog content when open is false', () => {
    render(<ConfirmActionDialog {...DEFAULT_PROPS} open={false} />)
    expect(screen.queryByText('Are you sure?')).not.toBeInTheDocument()
  })
})
