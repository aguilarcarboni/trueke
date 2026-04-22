export const MESSAGE_MAX_LENGTH = 500

export const QUICK_MESSAGE_TEMPLATES = [
  "Hi! Is this trade still available?",
  "Would you consider adding another item?",
  "I can meet this week to complete the exchange.",
  "Thanks! I can confirm this trade.",
] as const

export interface ConversationUser {
  user_id: string
  username: string
  profile_picture_url: string | null
}

export interface ConversationListItem {
  conversation_id: string
  exchange_id: string
  exchange_status: string
  created_at: string
  updated_at: string
  other_user: ConversationUser
  last_message_preview: string
  last_message_sender_id: string | null
  unread_count: number
}

export interface ProposalEntryDetails {
  exchange_id: string
  offered_items: string[]
  requested_items: string[]
  initial_message: string | null
}

export type ConversationEntryType = 'proposal' | 'message'

export interface ConversationEntry {
  entry_id: string
  conversation_id: string
  type: ConversationEntryType
  sender_user_id: string
  sender_name: string
  sender_avatar: string | null
  created_at: string
  content: string
  proposal_details?: ProposalEntryDetails
}

export interface SendMessageRequest {
  conversation_id: string
  sender_user_id: string
  content: string
}

export interface SendMessageResult {
  message_id: string
  created_at: string
}

/**
 * Ensure Supabase timestamps (which may lack a timezone suffix) are parsed as UTC.
 */
export function normalizeMessageTimestamp(ts: string): string {
  if (/[Zz]$/.test(ts) || /[+-]\d{2}:\d{2}$/.test(ts)) return ts
  return `${ts.trim()}Z`
}

/** Friendly timestamp for chat list and message footer labels. */
export function formatMessageTimestamp(dateString: string): string {
  const now = new Date()
  const date = new Date(normalizeMessageTimestamp(dateString))

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()

  if (isToday) {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()

  if (isYesterday) {
    return 'Yesterday'
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}
