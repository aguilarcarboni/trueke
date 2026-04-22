import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LoaderButton from './LoaderButton'

describe('LoaderButton', () => {
  it('renders the button text', () => {
    render(<LoaderButton isLoading={false} text="Save" />)
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('is enabled and calls onClick when not loading', () => {
    const onClick = vi.fn()
    render(<LoaderButton isLoading={false} text="Submit" onClick={onClick} />)

    const btn = screen.getByRole('button')
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled while isLoading is true', () => {
    render(<LoaderButton isLoading={true} text="Saving…" />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('shows spinner icon while loading', () => {
    const { container } = render(<LoaderButton isLoading={true} text="Saving…" />)
    // Lucide Loader2 renders an svg inside the button
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('does not show spinner when not loading', () => {
    const { container } = render(<LoaderButton isLoading={false} text="Save" />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('is disabled when the disabled prop is true even if not loading', () => {
    render(<LoaderButton isLoading={false} text="Save" disabled />)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('applies a custom className', () => {
    render(<LoaderButton isLoading={false} text="Save" className="my-custom-class" />)
    expect(screen.getByRole('button')).toHaveClass('my-custom-class')
  })
})
