'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import type { NotificationItem} from '@/lib/entities/notification'
import {
  getNotificationsAction,
  getNotificationSummaryAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '@/app/actions/notification'

const POLL_INTERVAL_MS = 30_000 // 30 seconds

/**
 * Custom hook: centralizes all notification state & actions.
 *
 * - Polls for unread count every 30 s (lightweight HEAD-style query).
 * - Full list is fetched lazily when the popover opens.
 * - Exposes mark-read actions for single + bulk.
 * - Returns everything the UI needs; no business logic leaks into components.
 */
export function useNotifications() {
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ''

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  // ── Polling for unread count (badge) ─────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!userId) return
    const summary = await getNotificationSummaryAction(userId)
    setUnreadCount(summary.unread)
  }, [userId])

  useEffect(() => {
    fetchUnreadCount()
    const id = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchUnreadCount])

  // ── Fetch full list (on popover open) ────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    const data = await getNotificationsAction(userId)
    setNotifications(data)
    setUnreadCount(data.filter((n) => !n.is_read).length)
    setLoading(false)
  }, [userId])

  // ── Mark single as read ──────────────────────────────────────────────────
  const markAsRead = useCallback(
    async (notificationId: string) => {
      const ok = await markNotificationReadAction(notificationId)
      if (ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.notification_id === notificationId ? { ...n, is_read: true } : n
          )
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      }
    },
    []
  )

  // ── Mark all as read ─────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    const ok = await markAllNotificationsReadAction(userId)
    if (ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    }
  }, [userId])

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
