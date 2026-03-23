export type ItemCondition = 'new' | 'like new' | 'used' | 'heavily used' | 'broken'

export type ItemType = 'physical' | 'digital'

export type ItemStatus = 'draft' | 'active' | 'contested' | 'traded' | 'deleted'

export interface Item {
    item_id: string
    title: string
    description: string
    condition: ItemCondition
    category: string
    item_type: ItemType
    status: ItemStatus
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

export interface ItemAddress {
    addressId: string | null
    countryCode: string
    addressLine1: string
    addressLine2: string
    muniDistrict: string
    city: string
    province: string
    zipCode: string
}

export interface ItemWithAddress extends Item {
    address: ItemAddress | null
}


export const ITEM_CONDITION_LABELS: Record<ItemCondition, string> = {
  'new': 'New',
  'like new': 'Like New',
  'used': 'Used',
  'heavily used': 'Heavily Used',
  'broken': 'Broken',
}

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  'physical': 'Physical',
  'digital': 'Digital',
}

export const ITEM_STATUS_LABELS: Record<ItemStatus, string> = {
  'draft': 'Draft',
  'active': 'Active',
  'contested': 'Contested',
  'traded': 'Traded',
  'deleted': 'Deleted',
}

export const ITEM_CONDITION_STYLES: Record<ItemCondition, string> = {
  'new': 'bg-success text-success-foreground',
  'like new': 'bg-success/80 text-success-foreground',
  'used': 'bg-primary text-primary-foreground',
  'heavily used': 'bg-warning text-warning-foreground',
  'broken': 'bg-destructive text-destructive-foreground',
}

export const ITEM_CONDITION_BADGE_STYLES: Record<ItemCondition, string> = {
  'new': 'bg-success/10 text-success border-success/20',
  'like new': 'bg-success/10 text-success border-success/20',
  'used': 'bg-primary/10 text-primary border-primary/20',
  'heavily used': 'bg-warning/10 text-warning border-warning/20',
  'broken': 'bg-destructive/10 text-destructive border-destructive/20',
}

export const ITEM_STATUS_STYLES: Record<ItemStatus, string> = {
  'draft': 'bg-muted/20 text-muted-foreground',
  'active': 'bg-success/20 text-success',
  'contested': 'bg-warning/20 text-warning-foreground',
  'traded': 'bg-accent/20 text-accent-foreground',
  'deleted': 'bg-destructive/20 text-destructive',
}

export function getConditionLabel(condition: string): string {
  return ITEM_CONDITION_LABELS[condition as ItemCondition] ?? condition
}

export function getConditionStyle(condition: string): string {
  return ITEM_CONDITION_STYLES[condition as ItemCondition] ?? ''
}

export function getConditionBadgeStyle(condition: string): string {
  return ITEM_CONDITION_BADGE_STYLES[condition as ItemCondition] ?? ''
}

export function getStatusLabel(status: string): string {
  return ITEM_STATUS_LABELS[status as ItemStatus] ?? status
}

export function getStatusStyle(status: string): string {
  return ITEM_STATUS_STYLES[status as ItemStatus] ?? ''
}

export const ITEM_CONDITIONS: ItemCondition[] = ['new', 'like new', 'used', 'heavily used', 'broken']

export const ITEM_TYPES: ItemType[] = ['physical', 'digital']

export const ITEM_STATUSES: ItemStatus[] = ['draft', 'active', 'contested', 'traded', 'deleted']
    