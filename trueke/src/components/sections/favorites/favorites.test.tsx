import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Favorites } from './favorites'
import type { UserList, UserListMember } from '@/lib/entities/user-list'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetUserListsAction = vi.fn()
const mockGetUserListMembersAction = vi.fn()
const mockRemoveUserFromListAction = vi.fn()
const mockDeleteCustomListAction = vi.fn()

vi.mock('@/app/actions/user-list', () => ({
  getUserListsAction: (...args: unknown[]) => mockGetUserListsAction(...args),
  getUserListMembersAction: (...args: unknown[]) => mockGetUserListMembersAction(...args),
  removeUserFromListAction: (...args: unknown[]) => mockRemoveUserFromListAction(...args),
  deleteCustomListAction: (...args: unknown[]) => mockDeleteCustomListAction(...args),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}))

vi.mock('@/components/sections/exchanges/user-profile-dialog', () => ({
  UserProfileDialog: ({
    userId,
    open,
  }: {
    userId: string | null
    open: boolean
  }) =>
    open && userId ? (
      <div data-testid="user-profile-dialog" data-user-id={userId}>
        Profile dialog
      </div>
    ) : null,
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
  locationLabel: 'Toronto, ON',
  averageRating: 4.2,
  totalReviews: 7,
  tradeCount: 3,
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
    it('renders the "Favorites" chip', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /favorites/i })).toBeInTheDocument()
      })
    })

    it('renders the "Frequent Users" chip', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /frequent users/i })).toBeInTheDocument()
      })
    })

    it('renders both predefined chips even when member counts are zero', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /favorites/i })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: /frequent users/i })).toBeInTheDocument()
      })
    })
  })

  // ── AC2: Predefined lists show no delete / rename controls ────────────────

  describe('AC2 – predefined lists cannot be deleted or renamed', () => {
    it('renders no delete button for the Favorites chip', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /favorites/i })).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /delete.*favorites/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /remove.*list/i })).not.toBeInTheDocument()
    })

    it('renders no rename input for the Frequent Users chip', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /frequent users/i })).toBeInTheDocument()
      })

      expect(screen.queryByRole('textbox', { name: /rename/i })).not.toBeInTheDocument()
    })
  })

  // ── AC3: Lists are accessible via chip bar ─────────────────────────────────

  describe('AC3 – lists are accessible via chip bar', () => {
    it('defaults to the first predefined list (Favorites)', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        // Favorites is auto-selected and its members fetched
        expect(mockGetUserListMembersAction).toHaveBeenCalledWith(FAVORITES_LIST.listId)
      })
    })

    it('marks the selected chip with aria-selected', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /favorites/i })).toHaveAttribute('aria-selected', 'true')
        expect(screen.getByRole('option', { name: /frequent users/i })).toHaveAttribute('aria-selected', 'false')
      })
    })

    it('switches to the Frequent Users list when its chip is clicked', async () => {
      const user = userEvent.setup()
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /frequent users/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('option', { name: /frequent users/i }))

      await waitFor(() => {
        expect(mockGetUserListMembersAction).toHaveBeenCalledWith(FREQUENT_LIST.listId)
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

    it('shows member-count badge including zero on predefined chips', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        const zeros = screen.getAllByText('0')
        expect(zeros.length).toBeGreaterThanOrEqual(2)
      })
    })

    it('shows "Custom Lists" chip and clicking it shows custom list cards', async () => {
      const user = userEvent.setup()
      mockGetUserListsAction.mockResolvedValue({
        success: true,
        data: [FAVORITES_LIST, FREQUENT_LIST, CUSTOM_LIST],
      })
      mockGetUserListMembersAction.mockResolvedValue({ success: true, data: [] })

      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /custom lists/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('option', { name: /custom lists/i }))

      await waitFor(() => {
        // The custom list card's select button should appear (distinct from its delete button)
        expect(screen.getByRole('button', { name: /^trading partners/i })).toBeInTheDocument()
      })
    })

    it('clicking a custom list card navigates to that list', async () => {
      const user = userEvent.setup()
      mockGetUserListsAction.mockResolvedValue({
        success: true,
        data: [FAVORITES_LIST, FREQUENT_LIST, CUSTOM_LIST],
      })
      mockGetUserListMembersAction.mockResolvedValue({ success: true, data: [] })

      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /custom lists/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('option', { name: /custom lists/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /^trading partners/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /^trading partners/i }))

      await waitFor(() => {
        expect(mockGetUserListMembersAction).toHaveBeenCalledWith(CUSTOM_LIST.listId)
      })
    })

    it('shows the "Create new list" button inside the Custom Lists view', async () => {
      const user = userEvent.setup()
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /custom lists/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('option', { name: /custom lists/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /create new list/i })).toBeInTheDocument()
      })
    })
  })

  // ── AC4: Members are fetched and rendered ─────────────────────────────────

  describe('AC4 – list members are displayed', () => {
    it('fetches members for the active (Favorites) list on mount', async () => {
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
        expect(screen.getByText(/no users in this list yet/i)).toBeInTheDocument()
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

    it('shows total member count for the active list', async () => {
      mockGetUserListsAction.mockResolvedValue({
        success: true,
        data: [{ ...FAVORITES_LIST, memberCount: 2 }, FREQUENT_LIST],
      })
      mockGetUserListMembersAction.mockResolvedValue({
        success: true,
        data: [MEMBER, { ...MEMBER, userId: 'member-2', username: 'janedoe' }],
      })

      render(<Favorites />)

      await waitFor(() => {
        const line = screen.getByText(/members in this list/i)
        expect(line.textContent).toMatch(/2\s+members in this list/i)
      })
    })

    it('opens the profile dialog when a member row is activated', async () => {
      const user = userEvent.setup()
      mockGetUserListsAction.mockResolvedValue({
        success: true,
        data: [{ ...FAVORITES_LIST, memberCount: 1 }, FREQUENT_LIST],
      })
      mockGetUserListMembersAction.mockResolvedValue({ success: true, data: [MEMBER] })

      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /view profile for @johndoe/i }))

      await waitFor(() => {
        expect(screen.getByTestId('user-profile-dialog')).toHaveAttribute('data-user-id', MEMBER.userId)
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

    it('fetches Frequent Users members when its chip is clicked', async () => {
      const user = userEvent.setup()
      mockGetUserListsAction.mockResolvedValue({
        success: true,
        data: [FAVORITES_LIST, { ...FREQUENT_LIST, memberCount: 1 }],
      })
      mockGetUserListMembersAction.mockResolvedValue({ success: true, data: [{ ...MEMBER, listId: FREQUENT_LIST.listId }] })

      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /frequent users/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('option', { name: /frequent users/i }))

      await waitFor(() => {
        expect(mockGetUserListMembersAction).toHaveBeenCalledWith(FREQUENT_LIST.listId)
      })
    })
  })

  // ── Custom list deletion story ─────────────────────────────────────────────

  describe('Custom list deletion', () => {
    async function openCustomListsView() {
      const user = userEvent.setup()
      mockGetUserListsAction.mockResolvedValue({
        success: true,
        data: [FAVORITES_LIST, FREQUENT_LIST, CUSTOM_LIST],
      })
      mockGetUserListMembersAction.mockResolvedValue({ success: true, data: [] })

      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /custom lists/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: /custom lists/i }))
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /delete list trading partners/i })
        ).toBeInTheDocument()
      })
      return user
    }

    // ── AC1: the user can delete any custom list they created ───────────────

    it('AC1: deletes the custom list when the user confirms', async () => {
      const user = await openCustomListsView()
      mockDeleteCustomListAction.mockResolvedValue({ success: true, data: null })

      await user.click(screen.getByRole('button', { name: /delete list trading partners/i }))

      const dialog = await screen.findByRole('alertdialog')
      await user.click(within(dialog).getByRole('button', { name: /delete list/i }))

      await waitFor(() => {
        expect(mockDeleteCustomListAction).toHaveBeenCalledWith(CUSTOM_LIST.listId)
      })
      await waitFor(() => {
        expect(screen.queryByText('Trading Partners')).not.toBeInTheDocument()
      })
    })

    // ── AC2: predefined lists cannot be deleted ────────────────────────────

    it('AC2: predefined list chips do not expose a delete control', async () => {
      setupEmptyLists()
      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /favorites/i })).toBeInTheDocument()
      })

      expect(
        screen.queryByRole('button', { name: /delete list favorites/i })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /delete list frequent users/i })
      ).not.toBeInTheDocument()
    })

    it('AC2: predefined lists are never passed to deleteCustomListAction', async () => {
      const user = userEvent.setup()
      mockGetUserListsAction.mockResolvedValue({
        success: true,
        data: [FAVORITES_LIST, FREQUENT_LIST, CUSTOM_LIST],
      })
      mockGetUserListMembersAction.mockResolvedValue({ success: true, data: [] })
      mockDeleteCustomListAction.mockResolvedValue({ success: true, data: null })

      render(<Favorites />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: /custom lists/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('option', { name: /custom lists/i }))

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /delete list trading partners/i })
        ).toBeInTheDocument()
      })

      // The only delete affordance in the view targets the custom list, never predefined ones
      const deleteButtons = screen.getAllByRole('button', { name: /^delete list /i })
      expect(deleteButtons).toHaveLength(1)
      expect(deleteButtons[0]).toHaveAccessibleName(/trading partners/i)
    })

    // ── AC3: a confirmation dialog is shown before deletion ────────────────

    it('AC3: shows a confirmation dialog and does NOT call the action until confirm is clicked', async () => {
      const user = await openCustomListsView()

      await user.click(screen.getByRole('button', { name: /delete list trading partners/i }))

      const dialog = await screen.findByRole('alertdialog')
      expect(within(dialog).getByText(/trading partners/i)).toBeInTheDocument()
      expect(mockDeleteCustomListAction).not.toHaveBeenCalled()
    })

    it('AC3: clicking cancel in the confirm dialog aborts the deletion', async () => {
      const user = await openCustomListsView()

      await user.click(screen.getByRole('button', { name: /delete list trading partners/i }))

      const dialog = await screen.findByRole('alertdialog')
      await user.click(within(dialog).getByRole('button', { name: /cancel/i }))

      expect(mockDeleteCustomListAction).not.toHaveBeenCalled()
      // Card is still there
      expect(screen.getByText('Trading Partners')).toBeInTheDocument()
    })

    // ── AC4: deleting a list doesn't delete the users in it ───────────────

    it('AC4: the confirmation copy explicitly states users remain on the platform', async () => {
      const user = await openCustomListsView()

      await user.click(screen.getByRole('button', { name: /delete list trading partners/i }))

      const dialog = await screen.findByRole('alertdialog')
      expect(
        within(dialog).getByText(/users.*remain on the platform/i)
      ).toBeInTheDocument()
    })

    // ── Resilience ─────────────────────────────────────────────────────────

    it('keeps the list in place when the delete action fails', async () => {
      const user = await openCustomListsView()
      mockDeleteCustomListAction.mockResolvedValue({ success: false, error: 'Network error' })

      await user.click(screen.getByRole('button', { name: /delete list trading partners/i }))
      const dialog = await screen.findByRole('alertdialog')
      await user.click(within(dialog).getByRole('button', { name: /delete list/i }))

      await waitFor(() => {
        expect(mockDeleteCustomListAction).toHaveBeenCalledWith(CUSTOM_LIST.listId)
      })
      // Failure should not remove the card
      expect(screen.getByText('Trading Partners')).toBeInTheDocument()
    })
  })

  // ── Error / edge cases ─────────────────────────────────────────────────────
  describe('edge cases', () => {
    it('renders gracefully when getUserListsAction returns no data', async () => {
      mockGetUserListsAction.mockResolvedValue({ success: false, error: 'Network error' })

      render(<Favorites />)

      // Should not crash and should show no list chips
      await waitFor(() => {
        expect(screen.queryByRole('option', { name: /favorites/i })).not.toBeInTheDocument()
      })
    })
  })
})
