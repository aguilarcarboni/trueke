// ============================================
// Exchange/Trade Proposal Types
// ============================================

export type ExchangeStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
export type ExchangeRole = 'initiator' | 'member'
export type ExchangeDirection = 'offered' | 'requested'

export interface ExchangeItem {
    item_id: string
    title: string
    condition: string
    owner_id: string
    images?: string[]
}

export interface ExchangeParticipant {
    user_id: string
    username: string
    role: ExchangeRole
    avatar?: string
}

export interface Exchange {
    exchange_id: string
    initiator_id: string
    initiator_name: string
    status: ExchangeStatus
    message: string | null
    created_at: string
    expires_at: string
    offered_items: ExchangeItem[]
    requested_items: ExchangeItem[]
    participants: ExchangeParticipant[]
}

export interface ExchangeListItem {
    exchange_id: string
    initiator_id: string
    initiator_name: string
    status: ExchangeStatus
    message: string | null
    created_at: string
    expires_at: string
    offered_count: number
    requested_count: number
}

export interface CreateExchangeRequest {
    initiator_id: string
    target_user_id: string
    offered_item_ids: string[]
    requested_item_ids: string[]
    message?: string
    expiration_days?: number // days to expiration (default: 7, can be days/weeks/months)
}

export interface AcceptExchangeRequest {
    exchange_id: string
    accepting_user_id: string
}

export interface RejectExchangeRequest {
    exchange_id: string
    rejecting_user_id: string
}

export interface CancelExchangeRequest {
    exchange_id: string
    initiator_user_id: string
}

// ============================================
// Item Types - Re-exported from item-constants.ts
// ============================================

// Re-export types from the centralized constants file
export type { ItemCondition, ItemType, ItemStatus } from './item-constants'

// Legacy alias for backward compatibility
export type ItemState = import('./item-constants').ItemStatus

export interface Item {
    item_id: string
    title: string
    description: string
    condition: import('./item-constants').ItemCondition
    category: string
    item_type: import('./item-constants').ItemType
    status: import('./item-constants').ItemStatus
    images: string[]
    owner_user_id: string
    owner_name: string
    owner_avatar?: string
    owner_location?: string
    owner_rating?: number
    owner_totalTrades?: number
    owner_joinedDate?: string
    last_date_uploaded: string
    date_bought?: string
    metadata?: Record<string, string>
}
