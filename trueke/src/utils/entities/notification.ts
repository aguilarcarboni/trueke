import { createClient } from '@/utils/supabase/server'
import type {
  NotificationItem,
  NotificationSummary,
  CreateNotificationParams,
} from '@/lib/entities/notification'
import {
  normalizeTimestamp,
  getNotificationTypeLabel,
} from '@/lib/entities/notification'
import { isEmailNotificationEnabled } from '@/utils/entities/notification-preference'
import { sendEmail } from '@/lib/email'

// ─── Read Operations ─────────────────────────────────────────────────────────

/**
 * Fetch the most recent notifications for a user (AC7).
 * Joins sender info for display (AC6: title, description, time).
 * Ordered newest-first; capped at `limit` rows.
 */
export async function getUserNotifications(
  userId: string,
  limit = 30
): Promise<NotificationItem[]> {
  const supabase = await createClient()

  // 1. Fetch notification rows (no FK join — avoids ambiguity with two FKs to user)
  const { data, error } = await supabase
    .from('notification')
    .select(
      `notification_id,
       type,
       title,
       body,
       is_read,
       sent_at,
       sender_user_id,
       reference_type,
       reference_id,
       priority`
    )
    .eq('recipient_user_id', userId)
    .eq('delivery_channel', 'in_app')
    .order('sent_at', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching notifications:', error)
    return []
  }

  if (!data || data.length === 0) return []

  // Sort client-side: rows with null sent_at (legacy) go to the end
  data.sort((a: any, b: any) => {
    const ta = a.sent_at ? new Date(a.sent_at).getTime() : 0
    const tb = b.sent_at ? new Date(b.sent_at).getTime() : 0
    return tb - ta // newest first
  })

  // 2. Batch-resolve sender display names (same pattern used in exchanges)
  const senderIds = Array.from(
    new Set(
      data
        .map((r: any) => r.sender_user_id)
        .filter(Boolean)
    )
  )

  const senderMap = new Map<string, { username: string; avatar: string }>()
  if (senderIds.length > 0) {
    const { data: senderRows } = await supabase
      .from('user')
      .select('user_id, username, profile_picture_url')
      .in('user_id', senderIds)

    for (const s of senderRows || []) {
      senderMap.set(s.user_id, {
        username: s.username,
        avatar: s.profile_picture_url || '',
      })
    }
  }

  return data.map((row: any) => {
    const sender = row.sender_user_id ? senderMap.get(row.sender_user_id) : null
    return {
      notification_id: row.notification_id,
      type: row.type,
      title: row.title,
      body: row.body,
      is_read: row.is_read,
      created_at: row.sent_at ? normalizeTimestamp(row.sent_at) : null,
      sender_user_id: row.sender_user_id,
      sender_name: sender?.username ?? null,
      sender_avatar: sender?.avatar ?? null,
      reference_type: row.reference_type,
      reference_id: row.reference_id,
      priority: row.priority ?? 'normal',
    }
  })
}

/**
 * Get unread count (for bell badge – AC8).
 */
export async function getNotificationSummary(
  userId: string
): Promise<NotificationSummary> {
  const supabase = await createClient()

  const { count: unread, error } = await supabase
    .from('notification')
    .select('notification_id', { count: 'exact', head: true })
    .eq('recipient_user_id', userId)
    .eq('delivery_channel', 'in_app')
    .eq('is_read', false)

  if (error) {
    console.error('Error fetching notification summary:', error)
    return { total: 0, unread: 0 }
  }

  return { total: 0, unread: unread ?? 0 }
}

// ─── Write Operations ────────────────────────────────────────────────────────

/**
 * Mark a single notification as read (AC8).
 */
export async function markNotificationRead(notificationId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notification')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('notification_id', notificationId)
    .eq('delivery_channel', 'in_app')

  if (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
  return true
}

/**
 * Mark ALL notifications as read for a user.
 */
export async function markAllNotificationsRead(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notification')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('recipient_user_id', userId)
    .eq('delivery_channel', 'in_app')
    .eq('is_read', false)

  if (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }
  return true
}

/**
 * Centralized notification creation.
 *
 * Every feature (exchanges, messages, meetings, etc.) calls this single
 * function to insert a notification row. This ensures a consistent schema
 * and makes it trivial to add new event types.
 *
 * Non-blocking by design: callers should await but failures are logged,
 * never propagated, so the main action cannot fail due to a notification bug.
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from('notification').insert({
      recipient_user_id: params.recipient_user_id,
      sender_user_id: params.sender_user_id ?? null,
      type: params.type,
      title: params.title,
      body: params.body,
      reference_type: params.reference_type ?? null,
      reference_id: params.reference_id ?? null,
      is_read: false,
      delivery_channel: 'in_app',
      status: 'queued',
      priority: params.priority ?? 'normal',
      sent_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Failed to create notification:', error)
      return false
    }

    const emailEnabled = await isEmailNotificationEnabled(
      params.recipient_user_id,
      params.type
    )

    if (!emailEnabled) return true

    const { data: recipient, error: recipientError } = await supabase
      .from('user')
      .select('email, first_name, username')
      .eq('user_id', params.recipient_user_id)
      .maybeSingle()

    if (recipientError) {
      console.error('Failed to load notification email recipient:', recipientError)
      return true
    }

    const recipientEmail = recipient?.email?.trim()
    if (!recipientEmail) {
      console.info(
        `Notification email skipped: missing recipient email user_id=${params.recipient_user_id}`
      )
      await supabase
        .from('notification')
        .update({ status: 'skipped', sent_at: new Date().toISOString() })
        .eq('recipient_user_id', params.recipient_user_id)
        .eq('type', params.type)
        .eq('delivery_channel', 'email')
        .eq('status', 'queued')
      return true
    }

    const title = params.title?.trim() || getNotificationTypeLabel(params.type)
    const body =
      params.body?.trim() || `You have a new ${getNotificationTypeLabel(params.type)} notification.`
    const displayName = recipient?.first_name?.trim() || recipient?.username?.trim() || 'there'

    const emailResult = await sendEmail({
      to: recipientEmail,
      subject: `Trueke - ${title}`,
      html: `
        <p>Hello ${displayName},</p>
        <p><strong>${title}</strong></p>
        <p>${body}</p>
        <p>You can view this in your Trueke notifications center.</p>
        <p>— Trueke</p>
      `,
    })

    if (!emailResult.ok) {
      console.error(
        `Notification email send failed user_id=${params.recipient_user_id} type=${params.type}: ${emailResult.error ?? 'unknown error'}`
      )
      await supabase
        .from('notification')
        .update({ status: 'failed', sent_at: new Date().toISOString() })
        .eq('recipient_user_id', params.recipient_user_id)
        .eq('type', params.type)
        .eq('delivery_channel', 'email')
        .eq('status', 'queued')
    } else {
      console.info(
        `Notification email sent user_id=${params.recipient_user_id} type=${params.type} to=${recipientEmail}`
      )
      await supabase
        .from('notification')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('recipient_user_id', params.recipient_user_id)
        .eq('type', params.type)
        .eq('delivery_channel', 'email')
        .eq('status', 'queued')
    }

    return true
  } catch (err) {
    console.error('Failed to create notification:', err)
    return false
  }
}
