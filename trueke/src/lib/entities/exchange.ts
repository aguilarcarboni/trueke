export type ExchangeStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled' | 'completed' | 'countered'
export type ExchangeRole = 'initiator' | 'member'
export type ExchangeDirection = 'offered' | 'requested'

// ─── Domain Models ───────────────────────────────────────────────────────────

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

/** Lightweight list item (counts only, for tab badges). */
export interface ExchangeListItem {
    exchange_id: string
    initiator_id: string
    initiator_name: string
    target_user_id: string
    target_name: string
    status: ExchangeStatus
    message: string | null
    created_at: string
    expires_at: string
    offered_count: number
    requested_count: number
    parent_exchange_id: string | null
}

/** Enriched list item with actual item details (AC1). */
export interface ExchangeListItemEnriched extends ExchangeListItem {
    offered_items: ExchangeItem[]
    requested_items: ExchangeItem[]
}

// ─── Request DTOs ────────────────────────────────────────────────────────────

export interface CreateExchangeRequest {
    initiator_id: string
    target_user_id: string
    offered_item_ids: string[]
    requested_item_ids: string[]
    message?: string
    expiration_days?: number
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
    /** User cancelling: must be initiator if pending; any participant if accepted */
    actor_user_id: string
}

export interface CompleteExchangeRequest {
    exchange_id: string
    completing_user_id: string
}

export interface CounterOfferRequest {
    parent_exchange_id: string
    actor_user_id: string
    offered_item_ids: string[]
    requested_item_ids: string[]
    message?: string
    expiration_days?: number
}

/** A single entry in the exchange history chain (AC8). */
export interface ExchangeHistoryEntry {
    exchange_id: string
    parent_exchange_id: string | null
    initiator_id: string
    initiator_name: string
    status: ExchangeStatus
    message: string | null
    created_at: string
    expires_at: string
    offered_items: ExchangeItem[]
    requested_items: ExchangeItem[]
}

// ─── Status Display Helpers ──────────────────────────────────────────────────

export const EXCHANGE_STATUS_LABELS: Record<ExchangeStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
    cancelled: 'Cancelled',
    completed: 'Completed',
    countered: 'Countered',
}

export const EXCHANGE_STATUS_STYLES: Record<ExchangeStatus, string> = {
    pending: 'bg-primary/10 text-primary border-primary/20',
    accepted: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    expired: 'bg-muted text-muted-foreground border-border',
    cancelled: 'bg-muted text-muted-foreground border-border',
    completed: 'bg-success/15 text-success border-success/25',
    countered: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
}

export function getExchangeStatusLabel(status: string): string {
    return EXCHANGE_STATUS_LABELS[status as ExchangeStatus] ?? status
}

export function getExchangeStatusStyle(status: string): string {
    return EXCHANGE_STATUS_STYLES[status as ExchangeStatus] ?? ''
}