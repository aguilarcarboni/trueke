import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeactivateAccountDialog } from './deactivate-account-dialog'

vi.mock('next-auth/react', () => ({ signOut: vi.fn() }))

describe('DeactivateAccountDialog', () => {
  it('renders the password label', () => {
    render(<DeactivateAccountDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('confirm button is disabled when password is empty', () => {
    render(<DeactivateAccountDialog open={true} onOpenChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /deactivate account/i })).toBeDisabled()
  })
})
