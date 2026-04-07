import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { NotificationBell } from './notification-bell'
import type { NotificationItem } from '@/lib/entities/notification'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockFetchNotifications = vi.fn()
const mockMarkAsRead = vi.fn()
const mockMarkAllAsRead = vi.fn()
const mockRouterPush = vi.fn()

vi.mock('@/hooks/use-notifications', () => ({
  useNotifications: () => ({
    notifications: mockNotifications,
    unreadCount: mockUnreadCount,
    loading: false,
    fetchNotifications: mockFetchNotifications,
    markAsRead: mockMarkAsRead,
    markAllAsRead: mockMarkAllAsRead,
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush }),
}))

// ── Reactive mock state ───────────────────────────────────────────────────────
// These are module-level variables that the mock closure reads from,
// so individual tests can override them.
let mockNotifications: NotificationItem[] = []
let mockUnreadCount = 0

function setMockState(count: number, notifications: NotificationItem[] = []) {
  mockUnreadCount = count
  mockNotifications = notifications
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setMockState(0)
  })

  // ── Bell button ─────────────────────────────────────────────────────────────

  it('renders the bell button', () => {
    render(<NotificationBell />)
    expect(screen.getByRole('button', { name: /notifications/i })).toBeInTheDocument()
  })

  // ── Badge count ─────────────────────────────────────────────────────────────

  it('does not show a badge when unreadCount is 0', () => {
    setMockState(0)
    render(<NotificationBell />)
    // Badge "0" should not be visible
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('shows the exact count when unreadCount is between 1 and 99', () => {
    setMockState(3)
    render(<NotificationBell />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows "99+" when unreadCount exceeds 99', () => {
    setMockState(150)
    render(<NotificationBell />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('shows "99" exactly at 99 unread', () => {
    setMockState(99)
    render(<NotificationBell />)
    expect(screen.getByText('99')).toBeInTheDocument()
  })

  it('includes unread count in the aria-label', () => {
    setMockState(5)
    render(<NotificationBell />)
    expect(
      screen.getByRole('button', { name: /5 unread/i })
    ).toBeInTheDocument()
  })

  // ── Opening popover ─────────────────────────────────────────────────────────

  it('calls fetchNotifications when the bell is clicked', async () => {
    render(<NotificationBell />)
    fireEvent.click(screen.getByRole('button', { name: /notifications/i }))

    await waitFor(() => {
      expect(mockFetchNotifications).toHaveBeenCalledTimes(1)
    })
  })

  it('does not call fetchNotifications on initial render', () => {
    render(<NotificationBell />)
    expect(mockFetchNotifications).not.toHaveBeenCalled()
  })
})
