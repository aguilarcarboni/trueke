'use server'

import type { NotificationItem, NotificationSummary } from '@/lib/entities/notification'
import {
  getUserNotifications,
  getNotificationSummary,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/utils/entities/notification'

/**
 * Server action: get the current user's notifications (AC7).
 */
export async function getNotificationsAction(
  userId: string,
  limit?: number
): Promise<NotificationItem[]> {
  if (!userId?.trim()) return []
  return getUserNotifications(userId, limit)
}

/**
 * Server action: get unread count (for bell badge – AC8).
 */
export async function getNotificationSummaryAction(
  userId: string
): Promise<NotificationSummary> {
  if (!userId?.trim()) return { total: 0, unread: 0 }
  return getNotificationSummary(userId)
}

/**
 * Server action: mark a single notification as read (AC8).
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<boolean> {
  if (!notificationId?.trim()) return false
  return markNotificationRead(notificationId)
}

/**
 * Server action: mark all notifications as read.
 */
export async function markAllNotificationsReadAction(
  userId: string
): Promise<boolean> {
  if (!userId?.trim()) return false
  return markAllNotificationsRead(userId)
}
