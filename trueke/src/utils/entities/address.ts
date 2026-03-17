import { createClient } from '@/utils/supabase/server'
import type { AddressFormData, Address } from '@/lib/entities/address'

// Fetches the current linked address for a user, or null if none exists.
export async function getLinkedAddress(userId: string): Promise<Address | null> {
    const supabase = await createClient()

    const { data: link } = await supabase
        .from('user_address')
        .select('address_id')
        .eq('user_id', userId)
        .eq('is_current', true)
        .maybeSingle()

    if (!link?.address_id) return null

    const { data: addr } = await supabase
        .from('address')
        .select('address_id, country_code, address_line1, address_line2, muni_district, canton_city, province_state, zip_code')
        .eq('address_id', link.address_id)
        .maybeSingle()

    if (!addr) return null

    return {
        addressId: addr.address_id,
        countryCode: addr.country_code ?? '',
        addressLine1: addr.address_line1 ?? '',
        addressLine2: addr.address_line2 ?? '',
        muniDistrict: addr.muni_district ?? '',
        city: addr.canton_city ?? '',
        province: addr.province_state ?? '',
        zipCode: addr.zip_code ?? '',
    }
}

// Creates a standalone address record (not linked to any user) and returns its ID.
export async function createAddressRecord(address: AddressFormData): Promise<{ addressId: string | null; error: string | null }> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('address')
        .insert({
            country_code:   address.countryCode.trim(),
            address_line1:  address.addressLine1?.trim()  ?? '',
            address_line2:  address.addressLine2?.trim()  ?? '',
            muni_district:  address.muniDistrict?.trim()  ?? '',
            canton_city:    address.city.trim(),
            province_state: address.province.trim(),
            zip_code:       address.zipCode.trim(),
        })
        .select('address_id')
        .single()

    if (error || !data?.address_id) {
        return { addressId: null, error: error?.message ?? 'Failed to create address.' }
    }

    return { addressId: data.address_id, error: null }
}

// Deduplicates, inserts if needed, then links the address to the user as current.
// Returns early (no-op) if the address hasn't changed.
export async function upsertUserAddress(userId: string, address: AddressFormData): Promise<{ error: string | null }> {
    const supabase = await createClient()

    // Fetch current linked address for change detection
    const { data: existingLink } = await supabase
        .from('user_address')
        .select('address_id')
        .eq('user_id', userId)
        .eq('is_current', true)
        .maybeSingle()

    let cur: Record<string, string> | null = null
    if (existingLink?.address_id) {
        const { data: curAddr } = await supabase
            .from('address')
            .select('country_code, address_line1, address_line2, muni_district, canton_city, province_state, zip_code')
            .eq('address_id', existingLink.address_id)
            .maybeSingle()
        cur = curAddr as Record<string, string> | null
    }

    const isUnchanged =
        cur &&
        cur.country_code   === address.countryCode.trim()         &&
        cur.address_line1  === (address.addressLine1?.trim() ?? '') &&
        cur.address_line2  === (address.addressLine2?.trim() ?? '') &&
        cur.muni_district  === (address.muniDistrict?.trim() ?? '') &&
        cur.canton_city    === address.city.trim()                 &&
        cur.province_state === address.province.trim()             &&
        cur.zip_code       === address.zipCode.trim()

    if (isUnchanged) return { error: null }

    // Deduplicate: reuse an identical existing address record if one exists
    const { data: matchingAddr } = await supabase
        .from('address')
        .select('address_id')
        .eq('country_code',   address.countryCode.trim())
        .eq('address_line1',  address.addressLine1?.trim()  ?? '')
        .eq('address_line2',  address.addressLine2?.trim()  ?? '')
        .eq('muni_district',  address.muniDistrict?.trim()  ?? '')
        .eq('canton_city',    address.city.trim())
        .eq('province_state', address.province.trim())
        .eq('zip_code',       address.zipCode.trim())
        .maybeSingle()

    let targetAddressId: string

    // If an identical address already exists, reuse it. Otherwise, create a new record.
    if (matchingAddr?.address_id) {
        targetAddressId = matchingAddr.address_id
    } else {
        const { data: newAddr, error: addrErr } = await supabase
            .from('address')
            .insert({
                country_code:   address.countryCode.trim(),
                address_line1:  address.addressLine1?.trim()  ?? '',
                address_line2:  address.addressLine2?.trim()  ?? '',
                muni_district:  address.muniDistrict?.trim()  ?? '',
                canton_city:    address.city.trim(),
                province_state: address.province.trim(),
                zip_code:       address.zipCode.trim(),
            })
            .select('address_id')
            .single()

        if (addrErr || !newAddr?.address_id) {
            return { error: addrErr?.message ?? 'Failed to create address.' }
        }
        targetAddressId = newAddr.address_id
    }

    // Link user → address as current (upsert handles already-linked edge case)
    const { error: linkErr } = await supabase
        .from('user_address')
        .upsert(
            { user_id: userId, address_id: targetAddressId, is_current: true },
            { onConflict: 'user_id,address_id' }
        )

    if (linkErr) return { error: linkErr.message }

    return { error: null }
}
