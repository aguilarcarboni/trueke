'use server'

import { createClient } from '@/utils/supabase/server'
import type { 
    ApiResponse, 

} from '@/lib/types'

import type {
    Exchange, 
    ExchangeListItem,
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
 * Accept an exchange proposal
 * Calls the database function accept_exchange
 */
export async function acceptExchange(
    request: AcceptExchangeRequest
): Promise<ApiResponse<null>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase.rpc('accept_exchange', {
            p_exchange_id: request.exchange_id,
            p_accepting_user_id: request.accepting_user_id,
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
            error: 'Unknown error accepting exchange',
        }
    } catch (err) {
        console.error('Error accepting exchange:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Reject an exchange proposal
 * Calls the database function reject_exchange
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
            return {
                success: false,
                error: error.message,
            }
        }

        if (data && data.length > 0) {
            const result = data[0]
            if (result.success) {
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
            error: 'Unknown error rejecting exchange',
        }
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
