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
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }))

describe('SignIn – deactivated account alert', () => {
  it('shows the deactivated message when account is inactive', async () => {
    render(<SignIn />)
    fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText(/^password$/i), { target: { value: 'pass' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    await waitFor(() =>
      expect(screen.getByText(/this account has been deactivated/i)).toBeInTheDocument()
    )
  })
})
