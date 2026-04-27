import { createAdminClient } from '@/utils/supabase/admin'
import { sendEmail } from '@/lib/email'
import { getNotificationTypeLabel } from '@/lib/entities/notification'
import type { NotificationType } from '@/lib/entities/notification'

type QueuedEmailNotification = {
  notification_id: string
  recipient_user_id: string
  type: NotificationType
  title: string
  body: string | null
  priority: 'low' | 'normal' | 'high'
}

type UserRow = {
  user_id: string
  email: string
  first_name: string | null
  username: string | null
}

type EnabledPreferenceRow = {
  user_id: string
  notification_type: NotificationType
}

export type EmailWorkerResult = {
  processed: number
  sent: number
  failed: number
  skipped: number
}

export type EmailWorkerOptions = {
  limit?: number
  recipientUserId?: string
  requestId?: string
}

const priorityRank = { high: 0, normal: 1, low: 2 }

function normalizeLimit(limit?: number): number {
  if (!Number.isFinite(limit) || !limit || limit <= 0) return 50
  return Math.min(limit, 200)
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function buildEmailHtml(name: string, title: string, body: string) {
  return `
    <p>Hello ${escapeHtml(name)},</p>
    <p><strong>${escapeHtml(title)}</strong></p>
    <p>${escapeHtml(body)}</p>
    <p>You can view this in your Trueke notifications center.</p>
    <p>— Trueke</p>
  `
}

export async function processQueuedEmailNotifications(
  options: EmailWorkerOptions = {}
): Promise<EmailWorkerResult> {
  const supabase = createAdminClient()
  const limit = normalizeLimit(options.limit)
  const logPrefix = options.requestId
    ? `process-email[${options.requestId}]`
    : 'process-email'

  let query = supabase
    .from('notification')
    .select('notification_id, recipient_user_id, type, title, body, priority')
    .eq('delivery_channel', 'email')
    .eq('status', 'queued')
    .order('sent_at', { ascending: true, nullsFirst: true })
    .limit(limit)

  if (options.recipientUserId) {
    query = query.eq('recipient_user_id', options.recipientUserId)
  }

  const { data, error } = await query
  if (error) {
    console.error(`${logPrefix}: failed to load queued notifications`, error)
    throw new Error('Failed to load queued notifications.')
  }

  const queued = (data ?? []) as QueuedEmailNotification[]
  console.info(`${logPrefix}: queued=${queued.length}`)
  if (queued.length === 0) {
    return { processed: 0, sent: 0, failed: 0, skipped: 0 }
  }

  queued.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])

  const recipientIds = Array.from(new Set(queued.map((n) => n.recipient_user_id)))

  const [{ data: usersData, error: userError }, { data: enabledPrefData, error: prefError }] =
    await Promise.all([
      supabase
        .from('user')
        .select('user_id, email, first_name, username')
        .in('user_id', recipientIds),
      supabase
        .from('notification_preference')
        .select('user_id, notification_type')
        .in('user_id', recipientIds)
        .eq('channel', 'email')
        .eq('is_enabled', true),
    ])

  if (userError) {
    console.error(`${logPrefix}: failed to load recipients`, userError)
    throw new Error('Failed to load recipients.')
  }

  if (prefError) {
    console.error(`${logPrefix}: failed to load preferences`, prefError)
    throw new Error('Failed to load preferences.')
  }

  const users = (usersData ?? []) as UserRow[]
  const userById = new Map(users.map((u) => [u.user_id, u]))

  const enabledPairs = new Set(
    ((enabledPrefData ?? []) as EnabledPreferenceRow[]).map(
      (row) => `${row.user_id}:${row.notification_type}`
    )
  )

  let sent = 0
  let failed = 0
  let skipped = 0

  for (const notification of queued) {
    const key = `${notification.recipient_user_id}:${notification.type}`
    const isEnabled = enabledPairs.has(key)

    if (!isEnabled) {
      skipped += 1
      console.info(
        `${logPrefix}: skip ${notification.notification_id} reason=preference_disabled`
      )
      await supabase
        .from('notification')
        .update({ status: 'skipped', sent_at: new Date().toISOString() })
        .eq('notification_id', notification.notification_id)
      continue
    }

    const recipient = userById.get(notification.recipient_user_id)
    if (!recipient?.email?.trim()) {
      skipped += 1
      console.info(
        `${logPrefix}: skip ${notification.notification_id} reason=missing_recipient_email`
      )
      await supabase
        .from('notification')
        .update({ status: 'skipped', sent_at: new Date().toISOString() })
        .eq('notification_id', notification.notification_id)
      continue
    }

    const fallbackLabel = getNotificationTypeLabel(notification.type)
    const title = notification.title?.trim() || fallbackLabel
    const body = notification.body?.trim() || `You have a new ${fallbackLabel} notification.`
    const recipientName = recipient.first_name?.trim() || recipient.username?.trim() || 'there'

    const emailResult = await sendEmail({
      to: recipient.email,
      subject: `Trueke - ${title}`,
      html: buildEmailHtml(recipientName, title, body),
    })

    if (!emailResult.ok) {
      failed += 1
      console.error(
        `${logPrefix}: fail ${notification.notification_id} reason=email_send_failed ${emailResult.error ?? ''}`
      )
      await supabase
        .from('notification')
        .update({ status: 'failed', sent_at: new Date().toISOString() })
        .eq('notification_id', notification.notification_id)
      continue
    }

    sent += 1
    console.info(
      `${logPrefix}: sent ${notification.notification_id} to=${recipient.email}`
    )
    await supabase
      .from('notification')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('notification_id', notification.notification_id)
  }

  const result = {
    processed: queued.length,
    sent,
    failed,
    skipped,
  }
  console.info(
    `${logPrefix}: done processed=${result.processed} sent=${result.sent} failed=${result.failed} skipped=${result.skipped}`
  )
  return result
}
