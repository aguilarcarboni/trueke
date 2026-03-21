import { z } from 'zod'

// Filterable address fields — all optional, no regex enforcement (these are filter values, not form inputs)
const MarketplaceAddressFilterSchema = z.object({
    country_code: z.string().trim().length(2).optional(),
    province:     z.string().trim().optional(),
    city:         z.string().trim().optional(),
})

// -- Marketplace Filter Zod Schema --
// search matches keywords against both item title and description (server-side ilike)
export const MarketplaceFilterSchema = z.object({
    search:    z.string().trim().optional(),
    category:  z.string().trim().optional(),
    condition: z.enum(['new', 'like new', 'used', 'heavily used', 'broken']).optional(),
    item_type: z.enum(['physical', 'digital']).optional(),
    address:   MarketplaceAddressFilterSchema.optional(),
    user_id:   z.string().uuid().optional(),
})

export type MarketplaceFilters = z.infer<typeof MarketplaceFilterSchema>
export type MarketplaceAddressFilters = z.infer<typeof MarketplaceAddressFilterSchema>