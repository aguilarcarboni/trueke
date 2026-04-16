import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  UserListMembers,
  UserListEmpty,
  UserListMembersSkeleton,
} from './user-list-members'
import type { UserListMember } from '@/lib/entities/user-list'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeMember(overrides: Partial<UserListMember> = {}): UserListMember {
  return {
    listId: 'list-1',
    userId: 'user-1',
    username: 'janedoe',
    firstName: 'Jane',
    lastName: 'Doe',
    profilePictureUrl: 'https://example.com/avatar.jpg',
    averageRating: 4,
    totalReviews: 10,
    addedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── UserListEmpty ──────────────────────────────────────────────────────────────

describe('UserListEmpty', () => {
  it('displays the list name in the empty message', () => {
    render(<UserListEmpty listName="Favorites" />)
    expect(screen.getByText(/no users in favorites yet/i)).toBeInTheDocument()
  })

  it('displays the list name in the empty message for Frequent Users', () => {
    render(<UserListEmpty listName="Frequent Users" />)
    expect(screen.getByText(/no users in frequent users yet/i)).toBeInTheDocument()
  })
})

// ── UserListMembersSkeleton ────────────────────────────────────────────────────

describe('UserListMembersSkeleton', () => {
  it('renders three skeleton cards', () => {
    const { container } = render(<UserListMembersSkeleton />)
    // Each skeleton card wraps two skeleton elements (name + subtitle)
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThanOrEqual(3)
  })
})

// ── UserListMembers – AC4 ──────────────────────────────────────────────────────

describe('UserListMembers', () => {
  // ── Empty state ────────────────────────────────────────────────────────────

  it('shows the empty state when the members array is empty', () => {
    render(<UserListMembers members={[]} listName="Favorites" />)
    expect(screen.getByText(/no users in favorites yet/i)).toBeInTheDocument()
  })

  // ── AC4: avatar, name, rating ─────────────────────────────────────────────

  it('renders the member full name', () => {
    render(<UserListMembers members={[makeMember()]} listName="Favorites" />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('renders the member username with @ prefix', () => {
    render(<UserListMembers members={[makeMember()]} listName="Favorites" />)
    expect(screen.getByText('@janedoe')).toBeInTheDocument()
  })

  it('renders the avatar fallback initials when no picture URL is set', () => {
    render(<UserListMembers members={[makeMember({ profilePictureUrl: '' })]} listName="Favorites" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('renders the numeric rating and review count', () => {
    render(<UserListMembers members={[makeMember({ averageRating: 4.2, totalReviews: 7 })]} listName="Favorites" />)
    expect(screen.getByText(/4\.2.*7/)).toBeInTheDocument()
  })

  it('shows "No reviews" text when totalReviews is 0', () => {
    render(<UserListMembers members={[makeMember({ averageRating: 0, totalReviews: 0 })]} listName="Favorites" />)
    expect(screen.getByText(/no reviews/i)).toBeInTheDocument()
  })

  it('renders 5 star icons per member card', () => {
    const { container } = render(<UserListMembers members={[makeMember()]} listName="Favorites" />)
    // Each star is an SVG rendered by lucide
    const stars = container.querySelectorAll('svg')
    // 5 stars + 1 UserX icon in remove button
    expect(stars.length).toBeGreaterThanOrEqual(5)
  })

  it('renders multiple members', () => {
    const members = [
      makeMember({ userId: 'u1', username: 'alice', firstName: 'Alice', lastName: 'Smith' }),
      makeMember({ userId: 'u2', username: 'bob', firstName: 'Bob', lastName: 'Jones' }),
    ]
    render(<UserListMembers members={members} listName="Favorites" />)
    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Jones')).toBeInTheDocument()
  })

  // ── Remove interaction ────────────────────────────────────────────────────

  it('renders a remove button for each member when onRemove is provided', () => {
    const onRemove = vi.fn()
    render(<UserListMembers members={[makeMember()]} listName="Favorites" onRemove={onRemove} />)
    expect(screen.getByRole('button', { name: /remove janedoe from list/i })).toBeInTheDocument()
  })

  it('does not render remove buttons when onRemove is not provided', () => {
    render(<UserListMembers members={[makeMember()]} listName="Favorites" />)
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument()
  })

  it('calls onRemove with the correct userId when clicked', () => {
    const onRemove = vi.fn()
    render(<UserListMembers members={[makeMember()]} listName="Favorites" onRemove={onRemove} />)
    fireEvent.click(screen.getByRole('button', { name: /remove janedoe from list/i }))
    expect(onRemove).toHaveBeenCalledWith('user-1')
  })

  it('disables the remove button while that user is being removed', () => {
    const onRemove = vi.fn()
    render(
      <UserListMembers
        members={[makeMember()]}
        listName="Favorites"
        onRemove={onRemove}
        removingUserId="user-1"
      />
    )
    expect(screen.getByRole('button', { name: /remove janedoe from list/i })).toBeDisabled()
  })

  it('does not disable the remove button for a different user being removed', () => {
    const onRemove = vi.fn()
    const members = [
      makeMember({ userId: 'user-1', username: 'alice' }),
      makeMember({ userId: 'user-2', username: 'bob' }),
    ]
    render(
      <UserListMembers
        members={members}
        listName="Favorites"
        onRemove={onRemove}
        removingUserId="user-1"
      />
    )
    expect(screen.getByRole('button', { name: /remove bob from list/i })).not.toBeDisabled()
  })

  // ── Fallback for missing name ──────────────────────────────────────────────

  it('falls back to username when both first and last name are empty', () => {
    render(
      <UserListMembers
        members={[makeMember({ firstName: '', lastName: '', username: 'ghostuser' })]}
        listName="Favorites"
      />
    )
    // The card should show the username as the primary label
    expect(screen.getByText('ghostuser')).toBeInTheDocument()
  })
})
