export type ExchangeStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled'
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
    status: ExchangeStatus
    message: string | null
    created_at: string
    expires_at: string
    offered_count: number
    requested_count: number
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
    initiator_user_id: string
}

// ─── Status Display Helpers ──────────────────────────────────────────────────

export const EXCHANGE_STATUS_LABELS: Record<ExchangeStatus, string> = {
    pending: 'Pending',
    accepted: 'Accepted',
    rejected: 'Rejected',
    expired: 'Expired',
    cancelled: 'Cancelled',
}

export const EXCHANGE_STATUS_STYLES: Record<ExchangeStatus, string> = {
    pending: 'bg-primary/10 text-primary border-primary/20',
    accepted: 'bg-success/10 text-success border-success/20',
    rejected: 'bg-destructive/10 text-destructive border-destructive/20',
    expired: 'bg-muted text-muted-foreground border-border',
    cancelled: 'bg-muted text-muted-foreground border-border',
}

export function getExchangeStatusLabel(status: string): string {
    return EXCHANGE_STATUS_LABELS[status as ExchangeStatus] ?? status
}

export function getExchangeStatusStyle(status: string): string {
    return EXCHANGE_STATUS_STYLES[status as ExchangeStatus] ?? ''
}