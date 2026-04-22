'use server'

import { createClient } from '@/utils/supabase/server'
import { ItemFilterSchema } from '@/lib/entities/filters'
import type { ItemFilters } from '@/lib/entities/filters'
import type { ApiResponse } from '@/lib/types'
import type { Item } from '@/lib/entities/item'
import { mapItemsWithOwnerAndMedia, BaseItemRow } from './exchange'

/**
 * Get marketplace items filtered by the provided criteria.
 * All filtering is performed server-side via Supabase query modifiers —
 * no client-side filtering occurs.
 *
 * Filter behaviour:
 *  - search       → case-insensitive match on title OR description (ilike)
 *  - category     → exact match
 *  - condition    → exact match against item_condition enum
 *  - item_type    → exact match against item_type enum
 *  - address      → resolves matching addresses first, then filters by item_id
 *  - owner_search → case-insensitive match on username, first_name, or last_name
 */
export async function getMarketplaceItems(
    rawFilters: ItemFilters = {}
): Promise<ApiResponse<Item[]>> {
    try {
        const parsed = ItemFilterSchema.safeParse(rawFilters)
        if (!parsed.success) {
            return { success: false, error: 'Invalid filter parameters' }
        }

        const filters = parsed.data
        const supabase = await createClient()

        // -- Address pre-filter --
        // If any address field is provided, resolve the set of item_ids whose
        // current address matches, then restrict the main query to that set.
        let addressItemIds: string[] | null = null

        const addrFilter = filters.address
        if (addrFilter && (addrFilter.country_code || addrFilter.province || addrFilter.city)) {
            let addressQuery = supabase.from('address').select('address_id')

            if (addrFilter.country_code) {
                addressQuery = addressQuery.eq('country_code', addrFilter.country_code)
            }
            if (addrFilter.province) {
                addressQuery = addressQuery.ilike('province_state', `%${addrFilter.province}%`)
            }
            if (addrFilter.city) {
                addressQuery = addressQuery.ilike('canton_city', `%${addrFilter.city}%`)
            }

            const { data: addressRows, error: addressError } = await addressQuery
            if (addressError) return { success: false, error: addressError.message }

            const addressIds = (addressRows ?? []).map((r) => r.address_id)
            if (addressIds.length === 0) return { success: true, data: [] }

            const { data: linkRows, error: linkError } = await supabase
                .from('item_address')
                .select('item_id')
                .in('address_id', addressIds)
                .eq('is_current', true)

            if (linkError) return { success: false, error: linkError.message }

            addressItemIds = (linkRows ?? []).map((r) => r.item_id)
            if (addressItemIds.length === 0) return { success: true, data: [] }
        }

        // Filter items that have more than three reports on them
        const { data: reportRows } = await supabase
            .from('report')
            .select('target_id')
            .eq('target_type', 'item')

        const reportCountMap: Record<string, number> = {}
        for (const row of reportRows ?? []) {
            reportCountMap[row.target_id] = (reportCountMap[row.target_id] ?? 0) + 1
        }
        const blockedItemIds = Object.entries(reportCountMap)
            .filter(([, count]) => count >= 3)
            .map(([id]) => id)

        // -- Main item query --
        let query = supabase
            .from('item')
            .select(
                'item_id,title,description,condition,category,item_type,status,owner_user_id,last_date_uploaded,date_bought'
            )
            .in('status', ['active', 'contested'])

        if (filters.search) {
            // Escape SQL wildcard characters to prevent unintended matches
            const safe = filters.search.replace(/%/g, '\\%').replace(/_/g, '\\_')
            query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
        }
        if (filters.category) {
            query = query.eq('category', filters.category)
        }
        if (filters.condition) {
            query = query.eq('condition', filters.condition)
        }
        if (filters.item_type) {
            query = query.eq('item_type', filters.item_type)
        }
        // -- Owner search pre-filter --
        // Split the query into tokens so "Alice Walker" matches first_name=Alice AND last_name=Walker.
        // Each token must match at least one of username / first_name / last_name (AND across tokens).
        if (filters.owner_search) {
            const tokens = filters.owner_search
                .split(/\s+/)
                .filter(Boolean)
                .map((t) => t.replace(/%/g, '\\%').replace(/_/g, '\\_'))

            let userQuery = supabase.from('user').select('user_id')
            for (const token of tokens) {
                userQuery = userQuery.or(
                    `username.ilike.%${token}%,first_name.ilike.%${token}%,last_name.ilike.%${token}%`
                )
            }

            const { data: userRows, error: userError } = await userQuery
            if (userError) return { success: false, error: userError.message }
            const ownerIds = (userRows ?? []).map((u) => u.user_id)
            if (ownerIds.length === 0) return { success: true, data: [] }
            query = query.in('owner_user_id', ownerIds)
        }
        if (addressItemIds !== null) {
            query = query.in('item_id', addressItemIds)
        }
        if (blockedItemIds.length > 0) {
            query = query.not('item_id', 'in', `(${blockedItemIds.join(',')})`)
        }

        query = query.order('last_date_uploaded', { ascending: false })

        const { data: items, error: itemsError } = await query
        if (itemsError) return { success: false, error: itemsError.message }

        return mapItemsWithOwnerAndMedia(supabase, (items ?? []) as BaseItemRow[])
    } catch (err) {
        console.error('Error fetching marketplace items:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}

/**
 * Return the distinct set of active item categories for populating filter controls.
 * Called once on mount, independently of the filter re-fetch.
 */
export async function getMarketplaceCategories(): Promise<ApiResponse<string[]>> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('item')
            .select('category')
            .in('status', ['active', 'contested'])

        if (error) return { success: false, error: error.message }

        const categories = Array.from(new Set((data ?? []).map((r) => r.category))).sort()
        return { success: true, data: categories }
    } catch (err) {
        console.error('Error fetching marketplace categories:', err)
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An error occurred',
        }
    }
}
