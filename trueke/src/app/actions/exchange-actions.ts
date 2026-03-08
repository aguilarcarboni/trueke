'use server'

import { createClient } from '@/utils/supabase/server'
import type { 
    ApiResponse, 
    Exchange, 
    ExchangeListItem,
    CreateExchangeRequest,
    AcceptExchangeRequest,
    RejectExchangeRequest,
    CancelExchangeRequest
} from '@/lib/types'

/**
 * Get user's own items from database
 * Only returns active items available for trading
 */
export async function getMyItems(userId: string): Promise<ApiResponse<any[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('item')
            .select('*')
            .eq('owner_user_id', userId)
            .eq('status', 'active')

        if (error) {
            return {
                success: false,
                error: error.message,
            }
        }

        return {
            success: true,
            data: data || [],
        }
    } catch (err) {
        console.error('Error fetching user items:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Get current user's profile from auth
 */
export async function getCurrentUser(): Promise<ApiResponse<any>> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return {
                success: false,
                error: 'Not authenticated',
            }
        }

        // Try to get user profile from database, but fallback to auth user
        const { data: userProfile } = await supabase
            .from('user')
            .select('*')
            .eq('user_id', user.id)
            .single()

        // Return user data (from profile table if exists, otherwise from auth)
        return {
            success: true,
            data: userProfile || {
                user_id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                avatar: user.user_metadata?.avatar_url,
            },
        }
    } catch (err) {
        console.error('Error fetching current user:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Get all items except user's own (for marketplace/selection)
 */
export async function getAvailableItems(userId: string): Promise<ApiResponse<any[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('item')
            .select('*')
            .eq('status', 'active')
            .neq('owner_user_id', userId)

        if (error) {
            return {
                success: false,
                error: error.message,
            }
        }

        return {
            success: true,
            data: data || [],
        }
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
export async function getMarketplaceItems(): Promise<ApiResponse<any[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('item')
            .select('*')
            .eq('status', 'active')

        if (error) {
            return {
                success: false,
                error: error.message,
            }
        }

        return {
            success: true,
            data: data || [],
        }
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
