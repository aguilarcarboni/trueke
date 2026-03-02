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

// Updates the user's profile information, including their address. Handles creating/updating address records as needed.
export async function updateUserProfile(
  userId: string,
  data: UpdateProfileData
): Promise<{ error: string | null }> {
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