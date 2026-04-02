import { EnumValues, z } from 'zod'
import { ITEM_CONDITIONS, ITEM_TYPES } from './item'

// -- Filterable address fields — all optional, no regex enforcement (these are filter values, not form inputs)
const AddressFilterSchema = z.object({
    country_code: z.string().trim().length(2).optional(),
    province:     z.string().trim().optional(),
    city:         z.string().trim().optional(),
})

// -- Item Filter Zod Schema --
export const ItemFilterSchema = z.object({
    search: z.string().trim().optional(),
    category: z.string().trim().optional(),
    condition: z.enum(ITEM_CONDITIONS as [string, ...string[]]).optional(),
    item_type: z.enum(ITEM_TYPES as [string, ...string[]]).optional(),
    address: AddressFilterSchema.optional(),
    owner_search: z.string().trim().optional(),
})

export type ItemFilters = z.infer<typeof ItemFilterSchema>
export type AddressFilters = z.infer<typeof AddressFilterSchema>

