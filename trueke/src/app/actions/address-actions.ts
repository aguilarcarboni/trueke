'use server'

import { AddressSchema } from '@/lib/address-types'
import type { AddressFormData, Address} from '@/lib/address-types'
import type { ApiResponse } from '@/lib/types'
import { getLinkedAddress, upsertUserAddress, createAddressRecord } from '@/utils/supabase/tables/address'

// Returns the current linked address for a user, or null if none exists.
export async function getUserAddress(userId: string): Promise<ApiResponse<Address | null>> {
    try {
        const address = await getLinkedAddress(userId)
        return { success: true, data: address }
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An unexpected error occurred.',
        }
    }
}

// Validates and upserts the address linked to a user.
export async function updateUserAddress(userId: string, addressData: AddressFormData): Promise<ApiResponse<null>> {
    const parsed = AddressSchema.safeParse(addressData)
    if (!parsed.success) {
        const message = parsed.error.errors.map((e) => e.message).join(' ')
        return { success: false, error: message }
    }

    try {
        const normalized: AddressFormData = {
            countryCode:  parsed.data.countryCode,
            city:         parsed.data.city,
            province:     parsed.data.province,
            zipCode:      parsed.data.zipCode,
            addressLine1: parsed.data.addressLine1 ?? '',
            addressLine2: parsed.data.addressLine2 ?? '',
            muniDistrict: parsed.data.muniDistrict ?? '',
        }
        const { error } = await upsertUserAddress(userId, normalized)
        if (error) return { success: false, error }
        return { success: true, data: null, message: 'Address updated successfully.' }
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An unexpected error occurred.',
        }
    }
}

// Validates and creates a standalone address record (not linked to a user).
export async function createAddress(addressData: AddressFormData): Promise<ApiResponse<{ addressId: string }>> {
    const parsed = AddressSchema.safeParse(addressData)
    if (!parsed.success) {
        const message = parsed.error.errors.map((e) => e.message).join(' ')
        return { success: false, error: message }
    }

    try {
        const normalized: AddressFormData = {
            countryCode:  parsed.data.countryCode,
            city:         parsed.data.city,
            province:     parsed.data.province,
            zipCode:      parsed.data.zipCode,
            addressLine1: parsed.data.addressLine1 ?? '',
            addressLine2: parsed.data.addressLine2 ?? '',
            muniDistrict: parsed.data.muniDistrict ?? '',
        }
        const { addressId, error } = await createAddressRecord(normalized)
        if (error || !addressId) return { success: false, error: error ?? 'Failed to create address.' }
        return { success: true, data: { addressId }, message: 'Address created successfully.' }
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'An unexpected error occurred.',
        }
    }
}

