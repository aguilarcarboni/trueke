'use server'

import type { ApiResponse } from '@/lib/types'
import type {
  ConversationEntry,
  ConversationListItem,
  SendMessageRequest,
  SendMessageResult,
} from '@/lib/entities/message'
import { MESSAGE_MAX_LENGTH } from '@/lib/entities/message'
import { createNotification } from '@/utils/entities/notification'
import { createClient } from '@/utils/supabase/server'

type ParticipantRow = {
  negotiation_id: string
  user_id: string
}

type ExchangeConversationRow = {
  exchange_id: string
  negotiation_id: string
  status: string
  creation_date: string
  optional_message: string | null
  initiator_user_id: string
}

type MessageRow = {
  message_id: string
  negotiation_id: string
  sender_user_id: string
  content: string
  created_at: string
}

type UserRow = {
  user_id: string
  username: string
  profile_picture_url: string | null
}

function asErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'An unexpected error occurred'
}

function normalizeContent(content: string): string {
  return content.replace(/\s+/g, ' ').trim()
}

function getConversationParticipantIds(rows: ParticipantRow[]): string[] {
  return Array.from(new Set(rows.map((row) => row.user_id)))
}

/**
 * Returns all exchange-linked conversations for the user.
 *
 * AC4: only 1:1 conversations are returned.
 * AC6: each row includes unread message count.
 */
export async function getMyConversations(
  userId: string
): Promise<ApiResponse<ConversationListItem[]>> {
  try {
    if (!userId?.trim()) {
      return { success: true, data: [] }
    }

    const supabase = await createClient()

    const { data: myMembershipRows, error: membershipError } = await supabase
      .from('negotiation_participant')
      .select('negotiation_id, user_id')
      .eq('user_id', userId)

    if (membershipError) {
      return { success: false, error: membershipError.message }
    }

    const conversationIds = Array.from(
      new Set((myMembershipRows || []).map((row: ParticipantRow) => row.negotiation_id))
    )

    if (conversationIds.length === 0) {
      return { success: true, data: [] }
    }

    const { data: allParticipantsRaw, error: participantsError } = await supabase
      .from('negotiation_participant')
      .select('negotiation_id, user_id')
      .in('negotiation_id', conversationIds)

    if (participantsError) {
      return { success: false, error: participantsError.message }
    }

    const allParticipants = (allParticipantsRaw || []) as ParticipantRow[]
    const participantsByConversation = new Map<string, ParticipantRow[]>()

    for (const row of allParticipants) {
      const rows = participantsByConversation.get(row.negotiation_id) || []
      rows.push(row)
      participantsByConversation.set(row.negotiation_id, rows)
    }

    const validConversationIds = conversationIds.filter((conversationId) => {
      const participants = participantsByConversation.get(conversationId) || []
      const participantIds = getConversationParticipantIds(participants)
      return participantIds.length === 2 && participantIds.includes(userId)
    })

    if (validConversationIds.length === 0) {
      return { success: true, data: [] }
    }

    const { data: exchangeRowsRaw, error: exchangeError } = await supabase
      .from('exchange')
      .select('exchange_id, negotiation_id, status, creation_date, optional_message, initiator_user_id')
      .in('negotiation_id', validConversationIds)

    if (exchangeError) {
      return {
        success: false,
        error: `Failed to load conversations from exchanges. Ensure exchange.negotiation_id exists. ${exchangeError.message}`,
      }
    }

    const exchangeRows = (exchangeRowsRaw || []) as ExchangeConversationRow[]
    if (exchangeRows.length === 0) {
      return { success: true, data: [] }
    }

    const exchangeByConversation = new Map<string, ExchangeConversationRow>()
    for (const row of exchangeRows) {
      const current = exchangeByConversation.get(row.negotiation_id)
      if (!current || new Date(current.creation_date).getTime() < new Date(row.creation_date).getTime()) {
        exchangeByConversation.set(row.negotiation_id, row)
      }
    }

    const exchangeConversationIds = Array.from(exchangeByConversation.keys())
    const exchangeIds = Array.from(
      new Set(Array.from(exchangeByConversation.values()).map((row) => row.exchange_id))
    )

    const { data: messageRowsRaw, error: messageError } = await supabase
      .from('message')
      .select('message_id, negotiation_id, sender_user_id, content, created_at')
      .eq('is_deleted', false)
      .in('negotiation_id', exchangeConversationIds)
      .order('created_at', { ascending: false })

    if (messageError) {
      return { success: false, error: messageError.message }
    }

    const messageRows = (messageRowsRaw || []) as MessageRow[]
    const lastMessageByConversation = new Map<string, MessageRow>()
    for (const row of messageRows) {
      if (!lastMessageByConversation.has(row.negotiation_id)) {
        lastMessageByConversation.set(row.negotiation_id, row)
      }
    }

    const unreadByConversation = new Map<string, number>()
    const { data: unreadRowsRaw, error: unreadError } = await supabase
      .from('notification')
      .select('reference_id')
      .eq('recipient_user_id', userId)
      .eq('type', 'message_received')
      .eq('reference_type', 'message')
      .eq('is_read', false)
      .in('reference_id', exchangeConversationIds)

    if (unreadError) {
      console.error('Failed to load unread message counts:', unreadError)
    } else {
      for (const row of unreadRowsRaw || []) {
        const conversationId = String((row as { reference_id: string | null }).reference_id || '')
        if (!conversationId) continue
        unreadByConversation.set(conversationId, (unreadByConversation.get(conversationId) || 0) + 1)
      }
    }

    if (exchangeIds.length > 0) {
      const conversationByExchangeId = new Map<string, string>()
      for (const [conversationId, exchange] of exchangeByConversation.entries()) {
        conversationByExchangeId.set(exchange.exchange_id, conversationId)
      }

      const { data: unreadProposalRowsRaw, error: unreadProposalError } = await supabase
        .from('notification')
        .select('reference_id')
        .eq('recipient_user_id', userId)
        .eq('type', 'proposal_created')
        .eq('reference_type', 'exchange')
        .eq('is_read', false)
        .in('reference_id', exchangeIds)

      if (unreadProposalError) {
        console.error('Failed to load unread proposal counts:', unreadProposalError)
      } else {
        for (const row of unreadProposalRowsRaw || []) {
          const exchangeId = String((row as { reference_id: string | null }).reference_id || '')
          if (!exchangeId) continue
          const conversationId = conversationByExchangeId.get(exchangeId)
          if (!conversationId) continue
          unreadByConversation.set(conversationId, (unreadByConversation.get(conversationId) || 0) + 1)
        }
      }
    }

    const otherUserIds = Array.from(
      new Set(
        exchangeConversationIds
          .map((conversationId) => {
            const rows = participantsByConversation.get(conversationId) || []
            const participantIds = getConversationParticipantIds(rows)
            return participantIds.find((id) => id !== userId) || null
          })
          .filter((id): id is string => Boolean(id))
      )
    )

    const userById = new Map<string, UserRow>()
    if (otherUserIds.length > 0) {
      const { data: userRowsRaw, error: userError } = await supabase
        .from('user')
        .select('user_id, username, profile_picture_url')
        .in('user_id', otherUserIds)

      if (userError) {
        return { success: false, error: userError.message }
      }

      for (const row of (userRowsRaw || []) as UserRow[]) {
        userById.set(row.user_id, row)
      }
    }

    const conversations: ConversationListItem[] = exchangeConversationIds
      .map((conversationId) => {
        const exchange = exchangeByConversation.get(conversationId)
        if (!exchange) return null

        const participantRows = participantsByConversation.get(conversationId) || []
        const participantIds = getConversationParticipantIds(participantRows)
        const otherUserId = participantIds.find((id) => id !== userId)
        if (!otherUserId) return null

        const otherUser = userById.get(otherUserId)
        const lastMessage = lastMessageByConversation.get(conversationId)
        const updatedAt = lastMessage?.created_at || exchange.creation_date

        return {
          conversation_id: conversationId,
          exchange_id: exchange.exchange_id,
          exchange_status: exchange.status,
          created_at: exchange.creation_date,
          updated_at: updatedAt,
          other_user: {
            user_id: otherUserId,
            username: otherUser?.username || 'Unknown User',
            profile_picture_url: otherUser?.profile_picture_url || null,
          },
          last_message_preview:
            lastMessage?.content?.trim() ||
            exchange.optional_message?.trim() ||
            'Trade proposal created',
          last_message_sender_id: lastMessage?.sender_user_id || null,
          unread_count: unreadByConversation.get(conversationId) || 0,
        }
      })
      .filter((conversation): conversation is ConversationListItem => Boolean(conversation))
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

    return {
      success: true,
      data: conversations,
    }
  } catch (err) {
    console.error('Error fetching conversations:', err)
    return {
      success: false,
      error: asErrorMessage(err),
    }
  }
}

/**
 * Returns the full conversation history and prepends a proposal summary entry.
 *
 * AC2: proposal details are exposed as the first entry.
 * AC3: every message includes sender and timestamp.
 */
export async function getConversationMessages(
  userId: string,
  conversationId: string
): Promise<ApiResponse<ConversationEntry[]>> {
  try {
    if (!userId?.trim() || !conversationId?.trim()) {
      return { success: false, error: 'Missing required fields.' }
    }

    const supabase = await createClient()

    const { data: participantRowsRaw, error: participantError } = await supabase
      .from('negotiation_participant')
      .select('user_id, negotiation_id')
      .eq('negotiation_id', conversationId)

    if (participantError) {
      return { success: false, error: participantError.message }
    }

    const participantRows = (participantRowsRaw || []) as ParticipantRow[]
    const participantIds = getConversationParticipantIds(participantRows)

    if (!participantIds.includes(userId)) {
      return { success: false, error: 'You are not a participant in this conversation.' }
    }

    if (participantIds.length !== 2) {
      return { success: false, error: 'This conversation is not 1:1.' }
    }

    const { data: exchangeRowRaw, error: exchangeError } = await supabase
      .from('exchange')
      .select('exchange_id, negotiation_id, status, creation_date, optional_message, initiator_user_id')
      .eq('negotiation_id', conversationId)
      .maybeSingle()

    if (exchangeError) {
      return {
        success: false,
        error: `Failed to load conversation exchange link. Ensure exchange.negotiation_id exists. ${exchangeError.message}`,
      }
    }

    const exchangeRow = exchangeRowRaw as ExchangeConversationRow | null
    if (!exchangeRow) {
      return { success: false, error: 'This conversation is not linked to an exchange.' }
    }

    const { data: exchangeItemsRaw, error: exchangeItemsError } = await supabase
      .from('exchange_item')
      .select('item_id, direction')
      .eq('exchange_id', exchangeRow.exchange_id)

    if (exchangeItemsError) {
      return { success: false, error: exchangeItemsError.message }
    }

    const exchangeItems = (exchangeItemsRaw || []) as Array<{
      item_id: string
      direction: 'offered' | 'requested'
    }>

    const itemIds = Array.from(new Set(exchangeItems.map((item) => item.item_id)))
    const itemTitleById = new Map<string, string>()

    if (itemIds.length > 0) {
      const { data: itemRowsRaw, error: itemError } = await supabase
        .from('item')
        .select('item_id, title')
        .in('item_id', itemIds)

      if (itemError) {
        return { success: false, error: itemError.message }
      }

      for (const row of (itemRowsRaw || []) as Array<{ item_id: string; title: string }>) {
        itemTitleById.set(row.item_id, row.title)
      }
    }

    const { data: messageRowsRaw, error: messageError } = await supabase
      .from('message')
      .select('message_id, negotiation_id, sender_user_id, content, created_at')
      .eq('negotiation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    if (messageError) {
      return { success: false, error: messageError.message }
    }

    const messageRows = (messageRowsRaw || []) as MessageRow[]

    const senderIds = Array.from(
      new Set([exchangeRow.initiator_user_id, ...messageRows.map((row) => row.sender_user_id)])
    )

    const senderById = new Map<string, UserRow>()
    if (senderIds.length > 0) {
      const { data: senderRowsRaw, error: senderError } = await supabase
        .from('user')
        .select('user_id, username, profile_picture_url')
        .in('user_id', senderIds)

      if (senderError) {
        return { success: false, error: senderError.message }
      }

      for (const sender of (senderRowsRaw || []) as UserRow[]) {
        senderById.set(sender.user_id, sender)
      }
    }

    const initialMessage = exchangeRow.optional_message?.trim() || null
    let renderedMessageRows = messageRows

    if (initialMessage && renderedMessageRows.length > 0) {
      const firstMessage = renderedMessageRows[0]
      if (
        firstMessage.sender_user_id === exchangeRow.initiator_user_id &&
        normalizeContent(firstMessage.content) === normalizeContent(initialMessage)
      ) {
        renderedMessageRows = renderedMessageRows.slice(1)
      }
    }

    const offeredItems = exchangeItems
      .filter((item) => item.direction === 'offered')
      .map((item) => itemTitleById.get(item.item_id) || 'Unknown item')

    const requestedItems = exchangeItems
      .filter((item) => item.direction === 'requested')
      .map((item) => itemTitleById.get(item.item_id) || 'Unknown item')

    const proposalSender = senderById.get(exchangeRow.initiator_user_id)

    const entries: ConversationEntry[] = [
      {
        entry_id: `proposal-${exchangeRow.exchange_id}`,
        conversation_id: conversationId,
        type: 'proposal',
        sender_user_id: exchangeRow.initiator_user_id,
        sender_name: proposalSender?.username || 'Unknown User',
        sender_avatar: proposalSender?.profile_picture_url || null,
        created_at: exchangeRow.creation_date,
        content: initialMessage || 'Trade proposal created.',
        proposal_details: {
          exchange_id: exchangeRow.exchange_id,
          offered_items: offeredItems,
          requested_items: requestedItems,
          initial_message: initialMessage,
        },
      },
      ...renderedMessageRows.map((row) => {
        const sender = senderById.get(row.sender_user_id)
        return {
          entry_id: row.message_id,
          conversation_id: conversationId,
          type: 'message' as const,
          sender_user_id: row.sender_user_id,
          sender_name: sender?.username || 'Unknown User',
          sender_avatar: sender?.profile_picture_url || null,
          created_at: row.created_at,
          content: row.content,
        }
      }),
    ]

    // Mark unread notifications for this conversation as read when opened.
    const { error: markReadError } = await supabase
      .from('notification')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('recipient_user_id', userId)
      .eq('type', 'message_received')
      .eq('reference_type', 'message')
      .eq('reference_id', conversationId)
      .eq('is_read', false)

    if (markReadError) {
      console.error('Failed to mark conversation notifications as read:', markReadError)
    }

    // If this conversation started from a proposal, clear that unread proposal notification too.
    const { error: markProposalReadError } = await supabase
      .from('notification')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('recipient_user_id', userId)
      .eq('type', 'proposal_created')
      .eq('reference_type', 'exchange')
      .eq('reference_id', exchangeRow.exchange_id)
      .eq('is_read', false)

    if (markProposalReadError) {
      console.error('Failed to mark proposal notifications as read:', markProposalReadError)
    }

    return { success: true, data: entries }
  } catch (err) {
    console.error('Error fetching conversation messages:', err)
    return { success: false, error: asErrorMessage(err) }
  }
}

/**
 * Sends a text message in an existing conversation.
 *
 * AC1: only participants can send.
 * AC4: conversation must remain 1:1.
 */
export async function sendMessage(
  request: SendMessageRequest
): Promise<ApiResponse<SendMessageResult>> {
  try {
    const conversationId = request.conversation_id?.trim()
    const senderUserId = request.sender_user_id?.trim()
    const content = normalizeContent(request.content || '')

    if (!conversationId || !senderUserId) {
      return { success: false, error: 'Missing required fields.' }
    }

    if (!content) {
      return { success: false, error: 'Message cannot be empty.' }
    }

    if (content.length > MESSAGE_MAX_LENGTH) {
      return {
        success: false,
        error: `Message must be ${MESSAGE_MAX_LENGTH} characters or less.`,
      }
    }

    const supabase = await createClient()

    const { data: participantRowsRaw, error: participantError } = await supabase
      .from('negotiation_participant')
      .select('user_id, negotiation_id')
      .eq('negotiation_id', conversationId)

    if (participantError) {
      return { success: false, error: participantError.message }
    }

    const participantRows = (participantRowsRaw || []) as ParticipantRow[]
    const participantIds = getConversationParticipantIds(participantRows)

    if (!participantIds.includes(senderUserId)) {
      return { success: false, error: 'You are not a participant in this conversation.' }
    }

    if (participantIds.length !== 2) {
      return { success: false, error: 'This conversation is not 1:1.' }
    }

    const { data: exchangeRowRaw, error: exchangeError } = await supabase
      .from('exchange')
      .select('exchange_id, negotiation_id, status, creation_date, optional_message, initiator_user_id')
      .eq('negotiation_id', conversationId)
      .maybeSingle()

    if (exchangeError) {
      return {
        success: false,
        error: `Failed to validate exchange conversation. Ensure exchange.negotiation_id exists. ${exchangeError.message}`,
      }
    }

    if (!exchangeRowRaw) {
      return { success: false, error: 'Messaging is only available for exchange conversations.' }
    }

    const { data: insertedMessage, error: insertError } = await supabase
      .from('message')
      .insert({
        negotiation_id: conversationId,
        sender_user_id: senderUserId,
        content,
      })
      .select('message_id, created_at')
      .single()

    if (insertError) {
      return { success: false, error: insertError.message }
    }

    const recipientUserId = participantIds.find((id) => id !== senderUserId)
    if (recipientUserId) {
      const { data: senderRowRaw } = await supabase
        .from('user')
        .select('username')
        .eq('user_id', senderUserId)
        .single()

      const senderName = (senderRowRaw as { username?: string } | null)?.username || 'Someone'
      const preview = content.length > 80 ? `${content.slice(0, 80)}...` : content

      await createNotification({
        recipient_user_id: recipientUserId,
        sender_user_id: senderUserId,
        type: 'message_received',
        title: 'New exchange message',
        body: `${senderName}: ${preview}`,
        reference_type: 'message',
        reference_id: conversationId,
      })
    }

    return {
      success: true,
      data: {
        message_id: insertedMessage.message_id,
        created_at: insertedMessage.created_at,
      },
    }
  } catch (err) {
    console.error('Error sending message:', err)
    return { success: false, error: asErrorMessage(err) }
  }
}
