"use server"

import { createClient } from '@/utils/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/utils/auth'

export interface NotificationRow {
  notification_id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  sent_at: string | null
  reference_type: string | null
  reference_id: string | null
}

export async function getNotifications(): Promise<{
  data?: NotificationRow[]
  unreadCount?: number
  error?: string
}> {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id?.trim()
    if (!userId) return { error: 'Unauthorized' }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('notification')
      .select(
        'notification_id,type,title,body,is_read,sent_at,reference_type,reference_id'
      )
      .eq('recipient_user_id', userId)
      .eq('delivery_channel', 'in_app')
      .order('sent_at', { ascending: false })
      .limit(30)

    if (error) {
      console.error('getNotifications error:', error)
      return { error: 'Failed to load notifications.' }
    }

    const rows = (data ?? []) as NotificationRow[]
    const unreadCount = rows.filter((n) => !n.is_read).length
    return { data: rows, unreadCount }
  } catch (err) {
    console.error('getNotifications error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function markNotificationRead(
  notificationId: string
): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id?.trim()
    if (!userId) return { error: 'Unauthorized' }

    const supabase = await createClient()

    const { error } = await supabase
      .from('notification')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('notification_id', notificationId)
      .eq('recipient_user_id', userId)

    if (error) {
      console.error('markNotificationRead error:', error)
      return { error: 'Failed to mark notification as read.' }
    }

    return {}
  } catch (err) {
    console.error('markNotificationRead error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function markAllNotificationsRead(): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id?.trim()
    if (!userId) return { error: 'Unauthorized' }

    const supabase = await createClient()

    const { error } = await supabase
      .from('notification')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('recipient_user_id', userId)
      .eq('is_read', false)

    if (error) {
      console.error('markAllNotificationsRead error:', error)
      return { error: 'Failed to mark notifications as read.' }
    }

    return {}
  } catch (err) {
    console.error('markAllNotificationsRead error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}
