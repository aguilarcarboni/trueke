// ============================================
// Item Constants - Aligned with DB Schema
// ============================================
// These types and constants match the Postgres enums in create-schema.sql

// ============================================
// Types (matching DB enums)
// ============================================

/**
 * item_condition enum: 'new', 'like new', 'used', 'heavily used', 'broken'
 */
export type ItemCondition = 'new' | 'like new' | 'used' | 'heavily used' | 'broken'

/**
 * item_type enum: 'physical', 'digital'
 */
export type ItemType = 'physical' | 'digital'

/**
 * item_status enum: 'draft', 'active', 'contested', 'traded', 'deleted'
 */
export type ItemStatus = 'draft' | 'active' | 'contested' | 'traded' | 'deleted'

// ============================================
// Display Labels
// ============================================

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

// ============================================
// Style Classes (Tailwind CSS)
// ============================================

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

// ============================================
// Helper Functions
// ============================================

/**
 * Get the display label for an item condition
 * Returns the condition value if not found in labels (graceful fallback)
 */
export function getConditionLabel(condition: string): string {
  return ITEM_CONDITION_LABELS[condition as ItemCondition] ?? condition
}

/**
 * Get the style class for an item condition
 * Returns empty string if not found (graceful fallback)
 */
export function getConditionStyle(condition: string): string {
  return ITEM_CONDITION_STYLES[condition as ItemCondition] ?? ''
}

/**
 * Get the badge style class for an item condition
 * Returns empty string if not found (graceful fallback)
 */
export function getConditionBadgeStyle(condition: string): string {
  return ITEM_CONDITION_BADGE_STYLES[condition as ItemCondition] ?? ''
}

/**
 * Get the display label for an item status
 * Returns the status value if not found in labels (graceful fallback)
 */
export function getStatusLabel(status: string): string {
  return ITEM_STATUS_LABELS[status as ItemStatus] ?? status
}

/**
 * Get the style class for an item status
 * Returns empty string if not found (graceful fallback)
 */
export function getStatusStyle(status: string): string {
  return ITEM_STATUS_STYLES[status as ItemStatus] ?? ''
}

/**
 * Array of all condition values for dropdowns/selects
 */
export const ITEM_CONDITIONS: ItemCondition[] = ['new', 'like new', 'used', 'heavily used', 'broken']

/**
 * Array of all type values for dropdowns/selects
 */
export const ITEM_TYPES: ItemType[] = ['physical', 'digital']

/**
 * Array of all status values for dropdowns/selects
 */
export const ITEM_STATUSES: ItemStatus[] = ['draft', 'active', 'contested', 'traded', 'deleted']
