export type ItemCondition = 'new' | 'like new' | 'used' | 'heavily used' | 'broken'

export type ItemType = 'physical' | 'digital'

export type ItemStatus = 'draft' | 'active' | 'contested' | 'traded' | 'deleted' | 'archived'

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
  'archived': 'Archived',
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
  'draft':     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  'active':    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  'contested': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  'traded':    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  'deleted':   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  'archived':  'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
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

export const ITEM_STATUSES: ItemStatus[] = ['draft', 'active', 'contested', 'traded', 'deleted', 'archived']

export const REPORT_ITEM_REASONS = [
  { value: 'misleading_description', label: 'Misleading Description' },
  { value: 'fake_item',              label: 'Fake Item' },
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'spam',                   label: 'Spam' },
  { value: 'other',                  label: 'Other' },
] as const

export type ReportItemReason = typeof REPORT_ITEM_REASONS[number]['value']
