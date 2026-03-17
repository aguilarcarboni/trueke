import { z } from 'zod'
import { Country } from 'country-state-city'

// -- Validation patterns --
export const LETTERS_ONLY    = /^[a-zA-Z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff\s'\-]+$/
export const ALPHANUMERIC    = /^[a-zA-Z0-9]+$/
export const LOCATION_TEXT   = /^[a-zA-Z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff\s'\-\.]+$/
export const ZIPCODE_PATTERN = /^[a-zA-Z0-9\s\-]+$/
export const ADDRESS_LINE    = /^[a-zA-Z0-9\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff\s'\-\.,#\/]+$/

// -- Address Zod Schema --
export const AddressSchema = z.object({
    countryCode: z.string()
        .min(1, "Country is required.")
        .max(2, "Country code must be 2 characters.")
        .refine((code) => !!Country.getCountryByCode(code), "Invalid country."),
    province: z.string()
        .min(1, "Province is required.")
        .max(75, "Province must be 75 characters or fewer.")
        .regex(LOCATION_TEXT, "Province may only contain letters."),
    city: z.string()
        .min(1, "City is required.")
        .max(75, "City must be 75 characters or fewer.")
        .regex(LOCATION_TEXT, "City may only contain letters."),
    zipCode: z.string()
        .min(1, "Zip code is required.")
        .max(10, "Zip code must be 10 characters or fewer.")
        .regex(ZIPCODE_PATTERN, "Zip code may only contain letters, numbers, and hyphens."),
    addressLine1: z.string()
        .max(100, "Address line 1 must be 100 characters or fewer.")
        .regex(ADDRESS_LINE, "Address line 1 contains invalid characters.")
        .optional().or(z.literal("")),
    addressLine2: z.string()
        .max(100, "Address line 2 must be 100 characters or fewer.")
        .regex(ADDRESS_LINE, "Address line 2 contains invalid characters.")
        .optional().or(z.literal("")),
    muniDistrict: z.string()
        .max(100, "Municipality must be 100 characters or fewer.")
        .regex(LOCATION_TEXT, "Municipality contains invalid characters.")
        .optional().or(z.literal("")),
})

// -- Address Form Data (no addressId, used for forms) --
export type AddressFormData = Omit<Address, 'addressId'>

// -- Address Interface --
export interface Address {
    addressId: string | null
    countryCode: string
    province: string
    city: string
    zipCode: string
    addressLine1: string
    addressLine2: string
    muniDistrict: string
}

export const EMPTY_ADDRESS: AddressFormData = {
    countryCode: "",
    addressLine1: "",
    addressLine2: "",
    muniDistrict: "",
    city: "",
    province: "",
    zipCode: "",
}
