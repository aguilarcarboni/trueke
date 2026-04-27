// ─── Notification Domain Types ───────────────────────────────────────────────

/** Matches the notification_type enum in the database. */
export type NotificationType =
  | 'account_created'
  | 'proposal_created'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'proposal_cancelled'
  | 'counter_offer'
  | 'message_received'
  | 'meeting_invite'
  | 'meeting_rsvp'
  | 'item_reported'
  | 'user_reported'
  | 'rating_received'
  | 'system'

/** The entity a notification is about (for deep-linking). */
export type NotificationReferenceType =
  | 'exchange'
  | 'proposal'
  | 'report'
  | 'negotiation'
  | 'message'
  | 'meeting'
  | 'item'
  | 'user'

export type NotificationPriority = 'low' | 'normal' | 'high'
export type NotificationChannel = 'in_app' | 'email'

// ─── Read Models ─────────────────────────────────────────────────────────────

/** A single notification as rendered in the UI (AC6). */
export interface NotificationItem {
  notification_id: string
  type: NotificationType
  title: string
  body: string
  is_read: boolean
  created_at: string | null
  /** Who triggered the notification (nullable for system events). */
  sender_user_id: string | null
  sender_name: string | null
  sender_avatar: string | null
  /** Deep-link metadata. */
  reference_type: NotificationReferenceType | null
  reference_id: string | null
  priority: NotificationPriority
}

/** Summary counters for badge rendering. */
export interface NotificationSummary {
  total: number
  unread: number
}

// ─── Write DTOs ──────────────────────────────────────────────────────────────

/** Parameters for creating a new notification (server-side only). */
export interface CreateNotificationParams {
  recipient_user_id: string
  sender_user_id?: string | null
  type: NotificationType
  title: string
  body: string
  reference_type?: NotificationReferenceType
  reference_id?: string
  priority?: NotificationPriority
}

export interface NotificationChannelPreference {
  type: NotificationType
  in_app_enabled: true
  email_enabled: boolean
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  account_created: 'Welcome',
  proposal_created: 'New Proposal',
  proposal_accepted: 'Proposal Accepted',
  proposal_rejected: 'Proposal Rejected',
  proposal_cancelled: 'Proposal Cancelled',
  counter_offer: 'Counter Offer',
  message_received: 'New Message',
  meeting_invite: 'Meeting Invite',
  meeting_rsvp: 'Meeting RSVP',
  item_reported: 'Item Reported',
  user_reported: 'User Reported',
  rating_received: 'New Rating',
  system: 'System',
}

export const NOTIFICATION_TYPES = Object.keys(
  NOTIFICATION_TYPE_LABELS
) as NotificationType[]

/** Map each type to a color token for the dot/icon. */
export const NOTIFICATION_TYPE_COLORS: Record<NotificationType, string> = {
  account_created: 'text-green-500',
  proposal_created: 'text-blue-500',
  proposal_accepted: 'text-green-500',
  proposal_rejected: 'text-red-500',
  proposal_cancelled: 'text-muted-foreground',
  counter_offer: 'text-amber-500',
  message_received: 'text-blue-500',
  meeting_invite: 'text-purple-500',
  meeting_rsvp: 'text-purple-500',
  item_reported: 'text-red-500',
  user_reported: 'text-red-500',
  rating_received: 'text-amber-500',
  system: 'text-muted-foreground',
}

/** Returns a human-readable label for a notification type. */
export function getNotificationTypeLabel(type: NotificationType): string {
  return NOTIFICATION_TYPE_LABELS[type] ?? type
}

/**
 * Ensure Supabase timestamps (which lack a Z suffix) are treated as UTC.
 * If the string already ends with Z or has a +/- offset, leave it as-is.
 */
export function normalizeTimestamp(ts: string): string {
  if (/[Zz]$/.test(ts) || /[+-]\d{2}:\d{2}$/.test(ts)) return ts
  return ts.trim() + 'Z'
}

/** Relative time label (e.g. "2 min ago", "3 hours ago", "yesterday"). */
export function formatNotificationTime(dateString: string | null): string {
  if (!dateString) return 'No date'

  const now = new Date()
  const date = new Date(normalizeTimestamp(dateString))
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)

  // Less than 2 minutes → "Just now"
  if (diffSec < 120) return 'Just now'

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }) // e.g. "3:18 PM"

  // Check if same calendar day
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) return timeStr // e.g. "3:18 PM"

  // Check if yesterday
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  if (isYesterday) return `Yesterday, ${timeStr}`

  // Older → date + time
  const dateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }) // e.g. "Mar 18" or "Mar 18, 2025"

  return `${dateStr}, ${timeStr}` // e.g. "Mar 18, 3:18 PM"
}
