import { createClient } from "@/utils/supabase/server"

// UserAddress mirror the address table structure, but with camelCase keys for easier use in the frontend
export interface UserAddress {
  addressId: string | null
  countryCode: string
  addressLine1: string
  addressLine2: string
  muniDistrict: string
  city: string        // canton_city
  province: string    // province_state
  zipCode: string
}

// UserProfile represents the combined data from the user table and their current address (if any) for use in the frontend
export interface UserProfile {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  bio: string
  profilePictureUrl: string
  address: UserAddress | null
  isAdmin: boolean
  createdAt: string
  status: string
}

// Data structure for updating user profile information, including nested address fields
export interface UpdateProfileData {
  firstName: string
  lastName: string
  username: string
  bio: string
  profilePictureUrl: string
  address: Omit<UserAddress, "addressId">
}

// Fetches the user's profile information, including their current address if available
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from("user")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error || !user) return null

  // Fetch current address
  const { data: userAddress } = await supabase
    .from("user_address")
    .select("address_id")
    .eq("user_id", userId)
    .eq("is_current", true)
    .maybeSingle()

  let address: UserAddress | null = null
  if (userAddress?.address_id) {
    const { data: addr } = await supabase
      .from("address")
      .select("address_id, country_code, address_line1, address_line2, muni_district, canton_city, province_state, zip_code")
      .eq("address_id", userAddress.address_id)
      .maybeSingle()

    if (addr) {
      address = {
        addressId: addr.address_id,
        countryCode: addr.country_code ?? "",
        addressLine1: addr.address_line1 ?? "",
        addressLine2: addr.address_line2 ?? "",
        muniDistrict: addr.muni_district ?? "",
        city: addr.canton_city ?? "",
        province: addr.province_state ?? "",
        zipCode: addr.zip_code ?? "",
      }
    }
  }

  return {
    id: user.user_id,
    email: user.email,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    bio: user.bio || "",
    profilePictureUrl: user.profile_picture_url || "",
    address,
    isAdmin: user.is_admin,
    createdAt: user.created_at,
    status: user.status,
  }
}

// Validation patterns (mirrors client-side rules)
const LETTERS_ONLY    = /^[a-zA-Z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff\s'\-]+$/
const ALPHANUMERIC    = /^[a-zA-Z0-9]+$/
const LOCATION_TEXT   = /^[a-zA-Z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff\s'\-\.]+$/
const ZIPCODE_PATTERN = /^[a-zA-Z0-9\s\-]+$/
const ADDRESS_LINE    = /^[a-zA-Z0-9\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff\s'\-\.,#\/]+$/

function validateProfileData(data: UpdateProfileData): string | null {
  const { firstName, lastName, username, address } = data

  if (!firstName.trim()) return "First name is required."
  if (!LETTERS_ONLY.test(firstName.trim())) return "First name may only contain letters or '-'."
  if (firstName.trim().length > 50) return "First name must be 50 characters or fewer."

  if (!lastName.trim()) return "Last name is required."
  if (!LETTERS_ONLY.test(lastName.trim())) return "Last name may only contain letters or '-'."
  if (lastName.trim().length > 50) return "Last name must be 50 characters or fewer."

  if (!username.trim()) return "Username is required."
  if (!ALPHANUMERIC.test(username.trim())) return "Username may only contain letters and numbers."

  const hasAnyAddressField = Object.values(address).some((v) => v.trim() !== "")
  if (hasAnyAddressField) {
    if (!address.countryCode.trim()) return "Country is required."
    if (!address.city.trim()) return "City is required."
    if (!LOCATION_TEXT.test(address.city.trim())) return "City may only contain letters."
    if (address.city.trim().length > 75) return "City must be 75 characters or fewer."
    if (!address.province.trim()) return "Province is required."
    if (!LOCATION_TEXT.test(address.province.trim())) return "Province may only contain letters."
    if (address.province.trim().length > 75) return "Province must be 75 characters or fewer."
    if (address.muniDistrict.trim() && !LOCATION_TEXT.test(address.muniDistrict.trim())) return "Municipality may only contain letters."
    if (address.muniDistrict.trim().length > 100) return "Municipality must be 100 characters or fewer."
    if (!address.zipCode.trim()) return "Zip code is required."
    if (!ZIPCODE_PATTERN.test(address.zipCode.trim())) return "Zip code may only contain letters, numbers and hyphens."
    if (address.zipCode.trim().length > 10) return "Zip code must be 10 characters or fewer."
    if (address.addressLine1.trim() && !ADDRESS_LINE.test(address.addressLine1.trim())) return "Address line 1 contains invalid characters."
    if (address.addressLine2.trim() && !ADDRESS_LINE.test(address.addressLine2.trim())) return "Address line 2 contains invalid characters."
  }

  return null
}

// Updates the user's profile information, including their address. Handles creating/updating address records as needed.
export async function updateUserProfile(
  userId: string,
  data: UpdateProfileData
): Promise<{ error: string | null }> {
  const validationError = validateProfileData(data)
  if (validationError) return { error: validationError }

  const supabase = await createClient()

  // Update user table fields
  const { error: userError } = await supabase
    .from("user")
    .update({
      first_name: data.firstName,
      last_name: data.lastName,
      username: data.username,
      bio: data.bio,
      profile_picture_url: data.profilePictureUrl,
    })
    .eq("user_id", userId)

  if (userError) return { error: userError.message }

  // Handle address fields
  const { address } = data
  const hasAddressData = Object.values(address).some((v) => v.trim())

  if (!hasAddressData) return { error: null }

  // Fetch the user's current linked address to detect changes
  const { data: existingLink } = await supabase
    .from("user_address")
    .select("address_id")
    .eq("user_id", userId)
    .eq("is_current", true)
    .maybeSingle()

  let cur: Record<string, string> | null = null

  // If user already has an address, fetch its details for comparison
  if (existingLink?.address_id) {
    const { data: curAddr } = await supabase
      .from("address")
      .select("country_code, address_line1, address_line2, muni_district, canton_city, province_state, zip_code")
      .eq("address_id", existingLink.address_id)
      .maybeSingle()
    cur = curAddr as Record<string, string> | null
  }

  // Check if address data is unchanged (treat null/empty as equivalent)
  const isUnchanged =
    cur &&
    cur.country_code   === (address.countryCode.trim()  || "XX") &&
    cur.address_line1  === address.addressLine1.trim()            &&
    cur.address_line2  === address.addressLine2.trim()            &&
    cur.muni_district  === address.muniDistrict.trim()            &&
    cur.canton_city    === address.city.trim()                    &&
    cur.province_state === address.province.trim()                &&
    cur.zip_code       === address.zipCode.trim()

  if (isUnchanged) return { error: null }

  // Address changed — look up if an identical record already exists
  const { data: matchingAddr } = await supabase
    .from("address")
    .select("address_id")
    .eq("country_code",   address.countryCode.trim() || "XX")
    .eq("address_line1",  address.addressLine1.trim())
    .eq("address_line2",  address.addressLine2.trim())
    .eq("muni_district",  address.muniDistrict.trim())
    .eq("canton_city",    address.city.trim())
    .eq("province_state", address.province.trim())
    .eq("zip_code",       address.zipCode.trim())
    .maybeSingle()

  let targetAddressId: string

  if (matchingAddr?.address_id) {
    // Reuse the existing address record
    targetAddressId = matchingAddr.address_id
  } else {
    // Create a new address record
    const { data: newAddr, error: addrErr } = await supabase
      .from("address")
      .insert({
        country_code:   address.countryCode.trim() || "XX",
        address_line1:  address.addressLine1.trim(),
        address_line2:  address.addressLine2.trim(),
        muni_district:  address.muniDistrict.trim(),
        canton_city:    address.city.trim(),
        province_state: address.province.trim(),
        zip_code:       address.zipCode.trim(),
      })
      .select("address_id")
      .single()

    if (addrErr || !newAddr?.address_id) return { error: addrErr?.message ?? "Failed to create address." }
    targetAddressId = newAddr.address_id
  }

  // Associate user with the target address; upsert handles the case where
  // the user was already linked to this address_id (e.g. re-using an old one)
  const { error: linkErr } = await supabase
    .from("user_address")
    .upsert(
      { user_id: userId, address_id: targetAddressId, is_current: true },
      { onConflict: "user_id,address_id" }
    )

  if (linkErr) return { error: linkErr.message }

  return { error: null }
}

// Fetches a user's associated listings/items for display on their profile page 