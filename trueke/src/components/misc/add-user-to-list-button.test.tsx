import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddUserToListButton } from './add-user-to-list-button'
import type { UserList } from '@/lib/entities/user-list'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockGetUserListFilteredAction = vi.fn()
const mockAddUserToListAction = vi.fn()

vi.mock('@/app/actions/user-list', () => ({
  getUserListFilteredAction: (...args: unknown[]) =>
    mockGetUserListFilteredAction(...args),
  addUserToListAction: (...args: unknown[]) =>
    mockAddUserToListAction(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeList(id: string, name: string): UserList {
  return {
    listId: id,
    ownerId: 'owner-1',
    name,
    description: null,
    isPredefined: false,
    createdAt: new Date().toISOString(),
    memberCount: 0,
  }
}

const LIST_A = makeList('list-a', 'Favorites')
const LIST_B = makeList('list-b', 'Frequent Traders')

// ── Helpers ───────────────────────────────────────────────────────────────────

interface SetupProps {
  targetUserId?: string
  targetUsername?: string
  className?: string
}

function setup({ targetUserId = 'user-target', targetUsername = 'johndoe', className }: SetupProps = {}) {
  const user = userEvent.setup()
  const view = render(
    <AddUserToListButton
      targetUserId={targetUserId}
      targetUsername={targetUsername}
      className={className}
    />
  )
  return { user, ...view }
}

async function openDropdown(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /add to list/i }))
  await waitFor(() => expect(screen.getByRole('menu')).toBeInTheDocument())
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AddUserToListButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUserListFilteredAction.mockResolvedValue({ success: true, data: [LIST_A, LIST_B] })
  })

  // ── Rendering ───────────────────────────────────────────────────────────────

  describe('initial render', () => {
    it('renders the trigger button with "Add to List" label', () => {
      setup()
      expect(screen.getByRole('button', { name: /add to list/i })).toBeInTheDocument()
    })

    it('is enabled on initial render', () => {
      setup()
      expect(screen.getByRole('button', { name: /add to list/i })).not.toBeDisabled()
    })

    it('forwards className to the trigger button', () => {
      setup({ className: 'w-full' })
      expect(screen.getByRole('button', { name: /add to list/i })).toHaveClass('w-full')
    })
  })

  // ── List fetching ────────────────────────────────────────────────────────────

  describe('list fetching on mount', () => {
    it('calls getUserListFilteredAction with the target user ID on mount', async () => {
      setup({ targetUserId: 'user-xyz' })
      await waitFor(() => {
        expect(mockGetUserListFilteredAction).toHaveBeenCalledWith('user-xyz')
      })
    })

    it('does not call getUserListFilteredAction when targetUserId is empty', () => {
      setup({ targetUserId: '' })
      expect(mockGetUserListFilteredAction).not.toHaveBeenCalled()
    })
  })

  // ── Dropdown content ─────────────────────────────────────────────────────────

  describe('dropdown content', () => {
    it('shows all list names after opening', async () => {
      const { user } = setup()
      await waitFor(() => expect(mockGetUserListFilteredAction).toHaveBeenCalled())
      await openDropdown(user)

      expect(screen.getByRole('menuitem', { name: /favorites/i })).toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /frequent traders/i })).toBeInTheDocument()
    })

    it('shows "No lists available" when the action returns an empty array', async () => {
      mockGetUserListFilteredAction.mockResolvedValue({ success: true, data: [] })
      const { user } = setup()
      await waitFor(() => expect(mockGetUserListFilteredAction).toHaveBeenCalled())
      await openDropdown(user)

      expect(screen.getByText(/no lists available/i)).toBeInTheDocument()
    })

    it('shows "No lists available" when the action returns success: false', async () => {
      mockGetUserListFilteredAction.mockResolvedValue({ success: false, error: 'Unauthorized' })
      const { user } = setup()
      await waitFor(() => expect(mockGetUserListFilteredAction).toHaveBeenCalled())
      await openDropdown(user)

      expect(screen.getByText(/no lists available/i)).toBeInTheDocument()
    })
  })

  // ── Adding a user to a list ──────────────────────────────────────────────────

  describe('adding a user', () => {
    it('calls addUserToListAction with the correct list ID and target user ID', async () => {
      mockAddUserToListAction.mockResolvedValue({ success: true })
      const { user } = setup({ targetUserId: 'user-target' })
      await waitFor(() => expect(mockGetUserListFilteredAction).toHaveBeenCalled())
      await openDropdown(user)

      await user.click(screen.getByRole('menuitem', { name: /favorites/i }))

      await waitFor(() => {
        expect(mockAddUserToListAction).toHaveBeenCalledWith('list-a', 'user-target')
      })
    })

    it('shows a success toast with the username and list name', async () => {
      mockAddUserToListAction.mockResolvedValue({ success: true })
      const { user } = setup({ targetUsername: 'johndoe' })
      await waitFor(() => expect(mockGetUserListFilteredAction).toHaveBeenCalled())
      await openDropdown(user)

      await user.click(screen.getByRole('menuitem', { name: /favorites/i }))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'User added',
            description: expect.stringContaining('johndoe'),
          })
        )
      })
    })

    it('removes the used list from the dropdown after a successful add', async () => {
      mockAddUserToListAction.mockResolvedValue({ success: true })
      const { user } = setup()
      await waitFor(() => expect(mockGetUserListFilteredAction).toHaveBeenCalled())
      await openDropdown(user)

      await user.click(screen.getByRole('menuitem', { name: /favorites/i }))

      await waitFor(() => expect(mockAddUserToListAction).toHaveBeenCalled())

      // Reopen to inspect updated list state
      await openDropdown(user)

      expect(screen.queryByRole('menuitem', { name: /favorites/i })).not.toBeInTheDocument()
      expect(screen.getByRole('menuitem', { name: /frequent traders/i })).toBeInTheDocument()
    })

    it('shows a destructive toast on failure', async () => {
      mockAddUserToListAction.mockResolvedValue({ success: false, error: 'Server error' })
      const { user } = setup()
      await waitFor(() => expect(mockGetUserListFilteredAction).toHaveBeenCalled())
      await openDropdown(user)

      await user.click(screen.getByRole('menuitem', { name: /favorites/i }))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ variant: 'destructive' })
        )
      })
    })

    it('keeps the list in the dropdown after a failed add', async () => {
      mockAddUserToListAction.mockResolvedValue({ success: false, error: 'Server error' })
      const { user } = setup()
      await waitFor(() => expect(mockGetUserListFilteredAction).toHaveBeenCalled())
      await openDropdown(user)

      await user.click(screen.getByRole('menuitem', { name: /favorites/i }))

      await waitFor(() => expect(mockAddUserToListAction).toHaveBeenCalled())

      // Reopen to confirm the list is still present
      await openDropdown(user)

      expect(screen.getByRole('menuitem', { name: /favorites/i })).toBeInTheDocument()
    })
  })
})
