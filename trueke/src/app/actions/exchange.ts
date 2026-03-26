'use server'

import { createClient } from '@/utils/supabase/server'
import type { 
    ApiResponse, 

} from '@/lib/types'

import type {
    Exchange, 
    ExchangeListItem,
    ExchangeListItemEnriched,
    ExchangeItem,
    CreateExchangeRequest,
    AcceptExchangeRequest,
    RejectExchangeRequest,
    CancelExchangeRequest
} from '@/lib/entities/exchange'
import type { Item } from '@/lib/entities/item'

export type BaseItemRow = {
    item_id: string
    title: string
    description: string | null
    condition: Item['condition']
    category: string
    item_type: Item['item_type']
    status: Item['status']
    owner_user_id: string
    last_date_uploaded: string
    date_bought: string | null
}

export async function mapItemsWithOwnerAndMedia(
    supabase: Awaited<ReturnType<typeof createClient>>,
    items: BaseItemRow[]
): Promise<ApiResponse<Item[]>> {
    if (!items || items.length === 0) {
        return {
            success: true,
            data: [],
        }
    }

    const itemIds = items.map((item) => item.item_id)
    const ownerIds = Array.from(new Set(items.map((item) => item.owner_user_id)))

    const [{ data: mediaRows, error: mediaError }, { data: ownerRows, error: ownerError }] = await Promise.all([
        supabase
            .from('item_media')
            .select('item_id,url,display_order')
            .in('item_id', itemIds)
            .order('display_order', { ascending: true }),
        supabase
            .from('user')
            .select('user_id,username,first_name,last_name,profile_picture_url')
            .in('user_id', ownerIds),
    ])

    if (mediaError) {
        return {
            success: false,
            error: mediaError.message,
        }
    }

    if (ownerError) {
        return {
            success: false,
            error: ownerError.message,
        }
    }

    const mediaByItem = new Map<string, string[]>()
    for (const media of mediaRows || []) {
        const existing = mediaByItem.get(media.item_id) || []
        existing.push(media.url)
        mediaByItem.set(media.item_id, existing)
    }

    const ownersById = new Map(
        (ownerRows || []).map((owner) => [
            owner.user_id,
            {
                fullName: `${owner.first_name || ''} ${owner.last_name || ''}`.trim(),
                username: owner.username,
                avatar: owner.profile_picture_url || '',
            },
        ])
    )

    const mappedItems: Item[] = items.map((item) => {
        const owner = ownersById.get(item.owner_user_id)
        return {
            item_id: item.item_id,
            title: item.title,
            description: item.description || '',
            condition: item.condition,
            category: item.category,
            item_type: item.item_type,
            status: item.status,
            images: mediaByItem.get(item.item_id) || [],
            owner_user_id: item.owner_user_id,
            owner_name: owner?.fullName || owner?.username || 'Unknown User',
            owner_avatar: owner?.avatar || '',
            last_date_uploaded: item.last_date_uploaded,
            date_bought: item.date_bought || undefined,
        }
    })

    return {
        success: true,
        data: mappedItems,
    }
}

/**
 * Get user's own items from database
 * Only returns active items available for trading
 */
export async function getMyItems(userId: string): Promise<ApiResponse<Item[]>> {
    try {
        const supabase = await createClient()

        const { data: items, error: itemsError } = await supabase
            .from('item')
            .select('item_id,title,description,condition,category,item_type,status,owner_user_id,last_date_uploaded,date_bought')
            .eq('owner_user_id', userId)
            .eq('status', 'active')
            .order('last_date_uploaded', { ascending: false })

        if (itemsError) {
            return {
                success: false,
                error: itemsError.message,
            }
        }

        return await mapItemsWithOwnerAndMedia(supabase, (items || []) as BaseItemRow[])
    } catch (err) {
        console.error('Error fetching user items:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Get all items except user's own (for marketplace/selection)
 */
export async function getAvailableItems(userId: string): Promise<ApiResponse<Item[]>> {
    try {
        const supabase = await createClient()

        const { data: items, error: itemsError } = await supabase
            .from('item')
            .select('item_id,title,description,condition,category,item_type,status,owner_user_id,last_date_uploaded,date_bought')
            .eq('status', 'active')
            .neq('owner_user_id', userId)
            .order('last_date_uploaded', { ascending: false })

        if (itemsError) {
            return {
                success: false,
                error: itemsError.message,
            }
        }

        return await mapItemsWithOwnerAndMedia(supabase, (items || []) as BaseItemRow[])
    } catch (err) {
        console.error('Error fetching available items:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Get all marketplace items (all active items for public marketplace)
 */
export async function getMarketplaceItems(): Promise<ApiResponse<Item[]>> {
    try {
        const supabase = await createClient()

        const { data: items, error: itemsError } = await supabase
            .from('item')
            .select('item_id,title,description,condition,category,item_type,status,owner_user_id,last_date_uploaded,date_bought')
            .eq('status', 'active')
            .order('last_date_uploaded', { ascending: false })

        if (itemsError) {
            return {
                success: false,
                error: itemsError.message,
            }
        }

        return await mapItemsWithOwnerAndMedia(supabase, (items || []) as BaseItemRow[])
    } catch (err) {
        console.error('Error fetching marketplace items:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Create a new exchange proposal
 * Calls the database function create_exchange_proposal
 */
export async function createExchangeProposal(
    request: CreateExchangeRequest
): Promise<ApiResponse<{exchange_id: string}>> {
    try {
        const supabase = await createClient()

        // Call the database function
        const { data, error } = await supabase.rpc('create_exchange_proposal', {
            p_initiator_id: request.initiator_id,
            p_target_user_id: request.target_user_id,
            p_offered_item_ids: request.offered_item_ids,
            p_requested_item_ids: request.requested_item_ids,
            p_message: request.message || null,
            p_expiration_days: request.expiration_days || 7,
        })

        if (error) {
            return {
                success: false,
                error: error.message,
            }
        }

        // Check if the function returned a success status
        if (data && data.length > 0) {
            const result = data[0]
            if (result.result_status === 'success') {
                // AC1: Notify the target user about the new proposal
                await sendExchangeNotification(
                    supabase,
                    result.exchange_id,
                    request.initiator_id,
                    'proposal_created',
                    'New Trade Proposal',
                    'Someone has sent you a new trade proposal!'
                )

                return {
                    success: true,
                    data: {
                        exchange_id: result.exchange_id,
                    },
                    message: result.result_message,
                }
            } else {
                return {
                    success: false,
                    error: result.result_message,
                }
            }
        }

        return {
            success: false,
            error: 'Unknown error creating exchange proposal',
        }
    } catch (err) {
        console.error('Error creating exchange proposal:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Get exchange details by ID
 * Calls the database function get_exchange_details
 */
export async function getExchangeDetails(
    exchangeId: string
): Promise<ApiResponse<Exchange>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase.rpc('get_exchange_details', {
            p_exchange_id: exchangeId,
        })

        if (error) {
            return {
                success: false,
                error: error.message,
            }
        }

        if (data && data.length > 0) {
            const result = data[0]
            return {
                success: true,
                data: {
                    exchange_id: result.exchange_id,
                    initiator_id: result.initiator_id,
                    initiator_name: result.initiator_name,
                    status: result.status,
                    message: result.message,
                    created_at: result.created_at,
                    expires_at: result.expires_at,
                    offered_items: result.offered_items || [],
                    requested_items: result.requested_items || [],
                    participants: result.participants || [],
                },
            }
        }

        return {
            success: false,
            error: 'Exchange not found',
        }
    } catch (err) {
        console.error('Error fetching exchange details:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Get user's exchanges
 * Calls the database function get_user_exchanges
 */
export async function getUserExchanges(
    userId: string,
    status?: string
): Promise<ApiResponse<ExchangeListItem[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase.rpc('get_user_exchanges', {
            p_user_id: userId,
            p_status: status || null,
        })

        if (error) {
            return {
                success: false,
                error: error.message,
            }
        }

        const exchanges: ExchangeListItem[] = (data || []).map((item: any) => ({
            exchange_id: item.exchange_id,
            initiator_id: item.initiator_id,
            initiator_name: item.initiator_name,
            target_user_id: '',  // populated by getUserExchangesEnriched
            target_name: '',     // populated by getUserExchangesEnriched
            status: item.status,
            message: item.message,
            created_at: item.created_at,
            expires_at: item.expires_at,
            offered_count: item.offered_count || 0,
            requested_count: item.requested_count || 0,
        }))

        return {
            success: true,
            data: exchanges,
        }
    } catch (err) {
        console.error('Error fetching user exchanges:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Get user's exchanges enriched with actual item details (AC1).
 * Fetches exchange list + item data in two batch queries (no N+1).
 */
export async function getUserExchangesEnriched(
    userId: string,
    status?: string
): Promise<ApiResponse<ExchangeListItemEnriched[]>> {
    try {
        const supabase = await createClient()

        // 1. Get base exchange list
        const listResult = await getUserExchanges(userId, status)
        if (!listResult.success || !listResult.data) {
            return { success: false, error: listResult.error }
        }

        const exchanges = listResult.data
        if (exchanges.length === 0) {
            return { success: true, data: [] }
        }

        const exchangeIds = exchanges.map((e) => e.exchange_id)

        // 2. Batch-fetch participants to resolve the target user (the "other" user)
        const { data: participantRows, error: participantError } = await supabase
            .from('exchange_participant')
            .select('exchange_id, user_id, role')
            .in('exchange_id', exchangeIds)

        if (participantError) {
            return { success: false, error: participantError.message }
        }

        // Resolve target user IDs (participant who is NOT the initiator)
        const targetByExchange = new Map<string, string>()
        for (const p of participantRows || []) {
            const ex = exchanges.find((e) => e.exchange_id === p.exchange_id)
            if (ex && p.user_id !== ex.initiator_id) {
                targetByExchange.set(p.exchange_id, p.user_id)
            }
        }

        // Batch-fetch target user names
        const targetUserIds = Array.from(new Set(targetByExchange.values()))
        const targetNameById = new Map<string, string>()
        if (targetUserIds.length > 0) {
            const { data: userRows } = await supabase
                .from('user')
                .select('user_id, username')
                .in('user_id', targetUserIds)
            for (const u of userRows || []) {
                targetNameById.set(u.user_id, u.username)
            }
        }

        // Stamp target info onto base exchange list
        for (const ex of exchanges) {
            const targetId = targetByExchange.get(ex.exchange_id) || ''
            ex.target_user_id = targetId
            ex.target_name = targetNameById.get(targetId) || 'Unknown'
        }

        // 3. Batch-fetch exchange_item rows with direction
        const { data: eiRows, error: eiError } = await supabase
            .from('exchange_item')
            .select('exchange_id, item_id, direction')
            .in('exchange_id', exchangeIds)

        if (eiError) {
            return { success: false, error: eiError.message }
        }

        const allItemIds = Array.from(new Set((eiRows || []).map((r: any) => r.item_id)))

        // 4. Batch-fetch item details + images
        const [{ data: itemRows, error: itemError }, { data: mediaRows, error: mediaError }] =
            await Promise.all([
                supabase
                    .from('item')
                    .select('item_id, title, condition, owner_user_id')
                    .in('item_id', allItemIds),
                supabase
                    .from('item_media')
                    .select('item_id, url, display_order')
                    .in('item_id', allItemIds)
                    .order('display_order', { ascending: true }),
            ])

        if (itemError) return { success: false, error: itemError.message }
        if (mediaError) return { success: false, error: mediaError.message }

        // Build lookup maps
        const mediaByItem = new Map<string, string[]>()
        for (const m of mediaRows || []) {
            const imgs = mediaByItem.get(m.item_id) || []
            imgs.push(m.url)
            mediaByItem.set(m.item_id, imgs)
        }

        const itemById = new Map<string, ExchangeItem>()
        for (const row of itemRows || []) {
            itemById.set(row.item_id, {
                item_id: row.item_id,
                title: row.title,
                condition: row.condition,
                owner_id: row.owner_user_id,
                images: mediaByItem.get(row.item_id) || [],
            })
        }

        // 5. Group exchange items by exchange_id + direction
        const offeredByExchange = new Map<string, ExchangeItem[]>()
        const requestedByExchange = new Map<string, ExchangeItem[]>()

        for (const ei of eiRows || []) {
            const item = itemById.get(ei.item_id)
            if (!item) continue
            const map = ei.direction === 'offered' ? offeredByExchange : requestedByExchange
            const list = map.get(ei.exchange_id) || []
            list.push(item)
            map.set(ei.exchange_id, list)
        }

        // 6. Merge into enriched list
        const enriched: ExchangeListItemEnriched[] = exchanges.map((ex) => ({
            ...ex,
            offered_items: offeredByExchange.get(ex.exchange_id) || [],
            requested_items: requestedByExchange.get(ex.exchange_id) || [],
        }))

        return { success: true, data: enriched }
    } catch (err) {
        console.error('Error fetching enriched exchanges:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Accept an exchange proposal.
 * 1. Validates all involved items are still active (AC6).
 * 2. Calls the DB function accept_exchange.
 * 3. Sends a notification to the initiator (proposal_accepted).
 */
export async function acceptExchange(
    request: AcceptExchangeRequest
): Promise<ApiResponse<null>> {
    try {
        const supabase = await createClient()

        // AC6 — Pre-check: verify all items in this exchange are still active
        const { data: eiRows, error: eiError } = await supabase
            .from('exchange_item')
            .select('item_id')
            .eq('exchange_id', request.exchange_id)

        if (eiError) {
            return { success: false, error: eiError.message }
        }

        const itemIds = (eiRows || []).map((r: any) => r.item_id)
        if (itemIds.length > 0) {
            const { data: items, error: itemError } = await supabase
                .from('item')
                .select('item_id, status')
                .in('item_id', itemIds)

            if (itemError) {
                return { success: false, error: itemError.message }
            }

            const unavailable = (items || []).filter((i: any) => i.status !== 'active')
            if (unavailable.length > 0) {
                return {
                    success: false,
                    error: 'One or more items are no longer available for trading.',
                }
            }
        }

        // Call DB function
        const { data, error } = await supabase.rpc('accept_exchange', {
            p_exchange_id: request.exchange_id,
            p_accepting_user_id: request.accepting_user_id,
        })

        if (error) {
            return { success: false, error: error.message }
        }

        if (data && data.length > 0) {
            const result = data[0]
            if (!result.success) {
                return { success: false, error: result.message }
            }
        } else {
            return { success: false, error: 'Unknown error accepting exchange' }
        }

        // Send notification to the initiator
        await sendExchangeNotification(
            supabase,
            request.exchange_id,
            request.accepting_user_id,
            'proposal_accepted',
            'Trade Proposal Accepted',
            'Your trade proposal has been accepted!'
        )

        return { success: true, message: 'Exchange accepted successfully' }
    } catch (err) {
        console.error('Error accepting exchange:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Reject an exchange proposal.
 * 1. Calls the DB function reject_exchange.
 * 2. Sends a notification to the initiator (proposal_rejected).
 */
export async function rejectExchange(
    request: RejectExchangeRequest
): Promise<ApiResponse<null>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase.rpc('reject_exchange', {
            p_exchange_id: request.exchange_id,
            p_rejecting_user_id: request.rejecting_user_id,
        })

        if (error) {
            return { success: false, error: error.message }
        }

        if (data && data.length > 0) {
            const result = data[0]
            if (!result.success) {
                return { success: false, error: result.message }
            }
        } else {
            return { success: false, error: 'Unknown error rejecting exchange' }
        }

        // Send notification to the initiator
        await sendExchangeNotification(
            supabase,
            request.exchange_id,
            request.rejecting_user_id,
            'proposal_rejected',
            'Trade Proposal Rejected',
            'Your trade proposal has been rejected.'
        )

        return { success: true, message: 'Exchange rejected successfully' }
    } catch (err) {
        console.error('Error rejecting exchange:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Cancel an exchange proposal
 * Calls the database function cancel_exchange
 * Only the initiator can cancel
 */
export async function cancelExchange(
    request: CancelExchangeRequest
): Promise<ApiResponse<null>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase.rpc('cancel_exchange', {
            p_exchange_id: request.exchange_id,
            p_initiator_user_id: request.initiator_user_id,
        })

        if (error) {
            return {
                success: false,
                error: error.message,
            }
        }

        if (data && data.length > 0) {
            const result = data[0]
            if (result.success) {
                // Notify the other party that the proposal was cancelled
                await sendExchangeNotification(
                    supabase,
                    request.exchange_id,
                    request.initiator_user_id,
                    'proposal_cancelled',
                    'Trade Proposal Cancelled',
                    'A trade proposal you were part of has been cancelled.'
                )

                return {
                    success: true,
                    message: result.message,
                }
            } else {
                return {
                    success: false,
                    error: result.message,
                }
            }
        }

        return {
            success: false,
            error: 'Unknown error cancelling exchange',
        }
    } catch (err) {
        console.error('Error cancelling exchange:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

import { createNotification } from '@/utils/entities/notification'
import type { NotificationType } from '@/lib/entities/notification'

/**
 * Create an in-app notification for the other party in an exchange.
 * Resolves the recipient by finding a participant that is NOT the acting user.
 * Non-blocking: errors are logged but do not fail the parent action.
 */
async function sendExchangeNotification(
    supabase: Awaited<ReturnType<typeof createClient>>,
    exchangeId: string,
    actingUserId: string,
    type: NotificationType,
    title: string,
    body: string
): Promise<void> {
    try {
        // Find the OTHER participant (the one who is NOT the acting user)
        const { data: participants } = await supabase
            .from('exchange_participant')
            .select('user_id')
            .eq('exchange_id', exchangeId)
            .neq('user_id', actingUserId)

        if (!participants || participants.length === 0) return

        const recipientId = participants[0].user_id

        await createNotification({
            recipient_user_id: recipientId,
            sender_user_id: actingUserId,
            type,
            title,
            body,
            reference_type: 'exchange',
            reference_id: exchangeId,
        })
    } catch (err) {
        // Notification failure should not block the main action
        console.error('Failed to send exchange notification:', err)
    }
}
