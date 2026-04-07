import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNotifications } from './use-notifications'
import type { NotificationItem } from '@/lib/entities/notification'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockGetNotificationsAction = vi.fn()
const mockGetNotificationSummaryAction = vi.fn()
const mockMarkNotificationReadAction = vi.fn()
const mockMarkAllNotificationsReadAction = vi.fn()

vi.mock('@/app/actions/notification', () => ({
  getNotificationsAction: (...args: unknown[]) =>
    mockGetNotificationsAction(...args),
  getNotificationSummaryAction: (...args: unknown[]) =>
    mockGetNotificationSummaryAction(...args),
  markNotificationReadAction: (...args: unknown[]) =>
    mockMarkNotificationReadAction(...args),
  markAllNotificationsReadAction: (...args: unknown[]) =>
    mockMarkAllNotificationsReadAction(...args),
}))

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'user-1' } } }),
}))

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeNotification(id: string, isRead: boolean): NotificationItem {
  return {
    notification_id: id,
    type: 'system',
    title: `Notification ${id}`,
    body: 'Test body',
    is_read: isRead,
    created_at: new Date().toISOString(),
    sender_user_id: null,
    sender_name: null,
    sender_avatar: null,
    reference_type: null,
    reference_id: null,
    priority: 'normal',
  }
}

const UNREAD_1 = makeNotification('n-1', false)
const UNREAD_2 = makeNotification('n-2', false)
const READ_3 = makeNotification('n-3', true)

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockGetNotificationSummaryAction.mockResolvedValue({ total: 3, unread: 2 })
    mockGetNotificationsAction.mockResolvedValue([UNREAD_1, UNREAD_2, READ_3])
    mockMarkNotificationReadAction.mockResolvedValue(true)
    mockMarkAllNotificationsReadAction.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fetches unread count on mount', async () => {
    const { result } = renderHook(() => useNotifications())

    // Flush React scheduler + pending microtasks (mock resolves immediately)
    await act(async () => {})

    expect(result.current.unreadCount).toBe(2)
    expect(mockGetNotificationSummaryAction).toHaveBeenCalledWith('user-1')
  })

  it('re-fetches unread count after 30 seconds (polling)', async () => {
    renderHook(() => useNotifications())

    // flush initial fetch
    await act(async () => {})

    expect(mockGetNotificationSummaryAction).toHaveBeenCalledTimes(1)

    // advance 30 seconds to trigger the setInterval callback
    await act(async () => {
      vi.advanceTimersByTime(30_000)
    })
    // flush the async callback enqueued by the interval
    await act(async () => {})

    expect(mockGetNotificationSummaryAction).toHaveBeenCalledTimes(2)
  })

  it('does not re-fetch before 30 seconds', async () => {
    renderHook(() => useNotifications())

    // flush initial fetch
    await act(async () => {})

    expect(mockGetNotificationSummaryAction).toHaveBeenCalledTimes(1)

    await act(async () => {
      vi.advanceTimersByTime(29_999)
    })

    expect(mockGetNotificationSummaryAction).toHaveBeenCalledTimes(1)
  })

  it('fetchNotifications loads the full list', async () => {
    const { result } = renderHook(() => useNotifications())

    await act(async () => {
      await result.current.fetchNotifications()
    })

    expect(result.current.notifications).toEqual([UNREAD_1, UNREAD_2, READ_3])
    expect(mockGetNotificationsAction).toHaveBeenCalledWith('user-1')
  })

  it('fetchNotifications also updates unreadCount from the list', async () => {
    const { result } = renderHook(() => useNotifications())

    await act(async () => {
      await result.current.fetchNotifications()
    })

    // 2 unread in FAKE_NOTIFICATIONS
    expect(result.current.unreadCount).toBe(2)
  })

  it('markAsRead performs optimistic update on local state', async () => {
    const { result } = renderHook(() => useNotifications())

    await act(async () => {
      await result.current.fetchNotifications()
    })

    expect(result.current.notifications.find((n) => n.notification_id === 'n-1')?.is_read).toBe(
      false
    )

    await act(async () => {
      await result.current.markAsRead('n-1')
    })

    expect(result.current.notifications.find((n) => n.notification_id === 'n-1')?.is_read).toBe(
      true
    )
    expect(mockMarkNotificationReadAction).toHaveBeenCalledWith('n-1')
  })

  it('markAsRead decrements unreadCount', async () => {
    const { result } = renderHook(() => useNotifications())

    await act(async () => {
      await result.current.fetchNotifications()
    })

    const before = result.current.unreadCount

    await act(async () => {
      await result.current.markAsRead('n-1')
    })

    expect(result.current.unreadCount).toBe(before - 1)
  })

  it('markAsRead does not decrement below 0', async () => {
    mockGetNotificationSummaryAction.mockResolvedValue({ total: 1, unread: 0 })
    const { result } = renderHook(() => useNotifications())

    // Manually set unreadCount to 0 by fetching with all-read list
    mockGetNotificationsAction.mockResolvedValue([READ_3])
    await act(async () => {
      await result.current.fetchNotifications()
    })

    await act(async () => {
      await result.current.markAsRead('n-3')
    })

    expect(result.current.unreadCount).toBe(0)
  })

  it('markAllAsRead marks all notifications as read in state', async () => {
    const { result } = renderHook(() => useNotifications())

    await act(async () => {
      await result.current.fetchNotifications()
    })

    await act(async () => {
      await result.current.markAllAsRead()
    })

    expect(result.current.notifications.every((n) => n.is_read)).toBe(true)
    expect(result.current.unreadCount).toBe(0)
    expect(mockMarkAllNotificationsReadAction).toHaveBeenCalledWith('user-1')
  })

  it('does not update state if markAllAsRead returns false', async () => {
    mockMarkAllNotificationsReadAction.mockResolvedValue(false)
    const { result } = renderHook(() => useNotifications())

    await act(async () => {
      await result.current.fetchNotifications()
    })

    const before = result.current.unreadCount

    await act(async () => {
      await result.current.markAllAsRead()
    })

    // State unchanged
    expect(result.current.unreadCount).toBe(before)
  })
})
