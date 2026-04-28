import { createClient } from '@/utils/supabase/server'
import type {
  NotificationChannelPreference,
  NotificationType,
} from '@/lib/entities/notification'
import { NOTIFICATION_TYPES } from '@/lib/entities/notification'

type EmailPreferenceRow = {
  notification_type: NotificationType
  is_enabled: boolean
}

export async function getNotificationChannelPreferences(
  userId: string
): Promise<NotificationChannelPreference[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notification_preference')
    .select('notification_type, is_enabled')
    .eq('user_id', userId)
    .eq('channel', 'email')

  if (error) {
    console.error('Error fetching notification preferences:', error)
    return NOTIFICATION_TYPES.map((type) => ({
      type,
      in_app_enabled: true,
      email_enabled: false,
    }))
  }

  const emailEnabledByType = new Map<NotificationType, boolean>()
  for (const row of (data ?? []) as EmailPreferenceRow[]) {
    emailEnabledByType.set(row.notification_type, Boolean(row.is_enabled))
  }

  return NOTIFICATION_TYPES.map((type) => ({
    type,
    in_app_enabled: true,
    email_enabled: emailEnabledByType.get(type) ?? false,
  }))
}

export async function setEmailNotificationPreference(
  userId: string,
  type: NotificationType,
  isEnabled: boolean
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase.from('notification_preference').upsert(
    {
      user_id: userId,
      notification_type: type,
      channel: 'email',
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,notification_type,channel' }
  )

  if (error) {
    console.error('Error saving notification preference:', error)
    return false
  }

  return true
}

export async function isEmailNotificationEnabled(
  userId: string,
  type: NotificationType
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('notification_preference')
    .select('is_enabled')
    .eq('user_id', userId)
    .eq('notification_type', type)
    .eq('channel', 'email')
    .maybeSingle()

  if (error) {
    console.error('Error checking email notification preference:', error)
    return false
  }

  return Boolean(data?.is_enabled)
}
