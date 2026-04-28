'use server'

import type {
  NotificationChannelPreference,
  NotificationType,
} from '@/lib/entities/notification'
import {
  getNotificationChannelPreferences,
  setEmailNotificationPreference,
} from '@/utils/entities/notification-preference'

export async function getNotificationPreferencesAction(
  userId: string
): Promise<NotificationChannelPreference[]> {
  if (!userId?.trim()) return []
  return getNotificationChannelPreferences(userId)
}

export async function setEmailNotificationPreferenceAction(
  userId: string,
  type: NotificationType,
  isEnabled: boolean
): Promise<boolean> {
  if (!userId?.trim()) return false
  return setEmailNotificationPreference(userId, type, isEnabled)
}
