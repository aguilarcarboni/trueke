import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SignIn from './SignIn'

vi.mock('next-auth/react', () => ({
  signIn: vi.fn().mockResolvedValue({ error: 'AccountDeactivated', ok: false }),
  useSession: () => ({ data: null }),
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}))
vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn(), dismiss: vi.fn(), toasts: [] }) }))

describe('SignIn – banned account', () => {
  it('does not show the reactivate link when account is banned', async () => {
    vi.mocked(await import('next-auth/react')).signIn = vi.fn().mockResolvedValue({ error: 'AccountBanned', ok: false })
    render(<SignIn />)
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: /reactivate account/i })).not.toBeInTheDocument()
    )
  })
})

describe('SignIn – deactivated account alert', () => {
  it('does not show the reactivate link when account is permanently deactivated', async () => {
    render(<SignIn />)
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(screen.queryByRole('link', { name: /reactivate account/i })).not.toBeInTheDocument()
    )
  })
})

describe('SignIn – recoverable deactivated account', () => {
  it('shows the reactivate link when account is recoverable', async () => {
    vi.mocked(await import('next-auth/react')).signIn = vi.fn().mockResolvedValue({ error: 'AccountDeactivatedRecoverable', ok: false })
    render(<SignIn />)
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /reactivate account/i })).toBeInTheDocument()
    )
  })
})
