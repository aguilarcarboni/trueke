import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Favorites } from './favorites'
import type { UserList, UserListMember } from '@/lib/entities/user-list'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetUserListsAction = vi.fn()
const mockGetUserListMembersAction = vi.fn()
const mockRemoveUserFromListAction = vi.fn()

vi.mock('@/app/actions/user-list', () => ({
  getUserListsAction: (...args: unknown[]) => mockGetUserListsAction(...args),
  getUserListMembersAction: (...args: unknown[]) => mockGetUserListMembersAction(...args),
  removeUserFromListAction: (...args: unknown[]) => mockRemoveUserFromListAction(...args),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FAVORITES_LIST: UserList = {
  listId: 'list-fav',
  ownerId: 'user-1',
  name: 'Favorites',
  description: 'Your saved favorite users',
  isPredefined: true,
  createdAt: '2026-01-01T00:00:00Z',
  memberCount: 0,
}

const FREQUENT_LIST: UserList = {
  listId: 'list-freq',
  ownerId: 'user-1',
  name: 'Frequent Users',
  description: 'Users you interact with frequently',
  isPredefined: true,
  createdAt: '2026-01-01T00:00:00Z',
  memberCount: 0,
}

const CUSTOM_LIST: UserList = {
  listId: 'list-custom',
  ownerId: 'user-1',
  name: 'Trading Partners',
  description: null,
  isPredefined: false,
  createdAt: '2026-01-01T00:00:00Z',
  memberCount: 1,
}

const MEMBER: UserListMember = {
  listId: 'list-fav',
  userId: 'member-1',
  username: 'johndoe',
  firstName: 'John',
  lastName: 'Doe',
  profilePictureUrl: '',
  averageRating: 4.2,
  totalReviews: 7,
  addedAt: '2026-01-02T00:00:00Z',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function setupEmptyLists() {
  mockGetUserListsAction.mockResolvedValue({
    success: true,
    data: [FAVORITES_LIST, FREQUENT_LIST],
  })
  mockGetUserListMembersAction.mockResolvedValue({ success: true, data: [] })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Favorites', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Loading state ──────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows skeleton cards while lists are being fetched', () => {
      // Never resolves during this test
      mockGetUserListsAction.mockReturnValue(new Promise(() => {}))

      const { container } = render(<Favorites />)

      // Skeleton renders divs with animate-pulse; check via aria or structure
      expect(container.querySelectorAll('[class*="animate-pulse"], [data-slot="skeleton"]').length).toBeGreaterThan(0)
    })
  })

  // ── AC1: Both predefined lists are always created ──────────────────────────

  describe('AC1 – predefined lists are present', () => {
    it('renders the "Favorites" tab trigger', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /favorites/i })).toBeInTheDocument()
      })
    })

    it('renders the "Frequent Users" tab trigger', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /frequent users/i })).toBeInTheDocument()
      })
    })

    it('renders both predefined tabs even when member counts are zero', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /favorites/i })).toBeInTheDocument()
        expect(screen.getByRole('tab', { name: /frequent users/i })).toBeInTheDocument()
      })
    })
  })

  // ── AC2: Predefined lists show no delete / rename controls ────────────────

  describe('AC2 – predefined lists cannot be deleted or renamed', () => {
    it('renders no delete button for the Favorites tab', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /favorites/i })).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /delete.*favorites/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /remove.*list/i })).not.toBeInTheDocument()
    })

    it('renders no rename input for the Frequent Users tab', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /frequent users/i })).toBeInTheDocument()
      })

      expect(screen.queryByRole('textbox', { name: /rename/i })).not.toBeInTheDocument()
    })
  })

  // ── AC3: Lists are accessible from the Favorites section ─────────────────

  describe('AC3 – lists are accessible via tabs', () => {
    it('defaults to the Favorites tab', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /favorites/i })).toHaveAttribute('data-state', 'active')
      })
    })

    it('switches to the Frequent Users tab when clicked', async () => {
      const user = userEvent.setup()
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /frequent users/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('tab', { name: /frequent users/i }))

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /frequent users/i })).toHaveAttribute('data-state', 'active')
      })
    })

    it('shows a member-count badge when the list has members', async () => {
      const listWithMembers = { ...FAVORITES_LIST, memberCount: 3 }
      mockGetUserListsAction.mockResolvedValue({
        success: true,
        data: [listWithMembers, FREQUENT_LIST],
      })
      mockGetUserListMembersAction.mockResolvedValue({ success: true, data: [] })

      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
      })
    })

    it('does not show the "My Lists" tab when there are no custom lists', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /favorites/i })).toBeInTheDocument()
      })

      expect(screen.queryByRole('tab', { name: /my lists/i })).not.toBeInTheDocument()
    })

    it('shows the "My Lists" tab when custom lists exist', async () => {
      mockGetUserListsAction.mockResolvedValue({
        success: true,
        data: [FAVORITES_LIST, FREQUENT_LIST, CUSTOM_LIST],
      })
      mockGetUserListMembersAction.mockResolvedValue({ success: true, data: [] })

      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /my lists/i })).toBeInTheDocument()
      })
    })
  })

  // ── AC4: Members are fetched and rendered ─────────────────────────────────

  describe('AC4 – list members are displayed', () => {
    it('fetches members for the active (Favorites) tab on mount', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(mockGetUserListMembersAction).toHaveBeenCalledWith(FAVORITES_LIST.listId)
      })
    })

    it('shows the empty state when the active list has no members', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByText(/no users in favorites yet/i)).toBeInTheDocument()
      })
    })

    it('renders member name and username when Favorites has members', async () => {
      mockGetUserListsAction.mockResolvedValue({
        success: true,
        data: [{ ...FAVORITES_LIST, memberCount: 1 }, FREQUENT_LIST],
      })
      mockGetUserListMembersAction.mockResolvedValue({ success: true, data: [MEMBER] })

      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('@johndoe')).toBeInTheDocument()
      })
    })

    it('removes a member from the list when the remove button is clicked', async () => {
      mockGetUserListsAction.mockResolvedValue({
        success: true,
        data: [{ ...FAVORITES_LIST, memberCount: 1 }, FREQUENT_LIST],
      })
      mockGetUserListMembersAction.mockResolvedValue({ success: true, data: [MEMBER] })
      mockRemoveUserFromListAction.mockResolvedValue({ success: true, data: null })

      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: /remove johndoe from list/i }))

      await waitFor(() => {
        expect(mockRemoveUserFromListAction).toHaveBeenCalledWith(FAVORITES_LIST.listId, MEMBER.userId)
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
      })
    })

    it('fetches Frequent Users members when that tab is clicked', async () => {
      const user = userEvent.setup()
      mockGetUserListsAction.mockResolvedValue({
        success: true,
        data: [FAVORITES_LIST, { ...FREQUENT_LIST, memberCount: 1 }],
      })
      mockGetUserListMembersAction.mockResolvedValue({ success: true, data: [{ ...MEMBER, listId: FREQUENT_LIST.listId }] })

      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /frequent users/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('tab', { name: /frequent users/i }))

      await waitFor(() => {
        expect(mockGetUserListMembersAction).toHaveBeenCalledWith(FREQUENT_LIST.listId)
      })
    })
  })

  // ── Error / edge cases ─────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('renders gracefully when getUserListsAction returns no data', async () => {
      mockGetUserListsAction.mockResolvedValue({ success: false, error: 'Network error' })

      render(<Favorites />)

      // Should not crash and should show no tabs
      await waitFor(() => {
        expect(screen.queryByRole('tab')).not.toBeInTheDocument()
      })
    })
  })
})
