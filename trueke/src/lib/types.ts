export interface Map {
    [key: string]: any
}

// ============================================
// Re-export Exchange Types from exchangeTypes.ts
// ============================================
export type {
    ExchangeStatus,
    ExchangeRole,
    ExchangeDirection,
    ExchangeItem,
    ExchangeParticipant,
    Exchange,
    ExchangeListItem,
    CreateExchangeRequest,
    AcceptExchangeRequest,
    RejectExchangeRequest,
    CancelExchangeRequest,
    Item,
    ItemCondition,
    ItemType,
    ItemState,
    ItemStatus,
} from './exchangeTypes'

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
    success: boolean
    data?: T
    message?: string
    error?: string
}
