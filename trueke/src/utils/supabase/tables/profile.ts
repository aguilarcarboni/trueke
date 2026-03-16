import { createClient } from "@/utils/supabase/server"
import { LETTERS_ONLY, ALPHANUMERIC, AddressSchema } from "@/lib/address-types"
import { getLinkedAddress, upsertUserAddress } from "@/utils/supabase/tables/address"

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

  const address = await getLinkedAddress(userId)

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
    const result = AddressSchema.safeParse(address)
    if (!result.success) return result.error.errors[0].message
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

  // Delegate address persistence to the address table utility
  const hasAddressData = Object.values(data.address).some((v) => v.trim())
  if (!hasAddressData) return { error: null }

  return upsertUserAddress(userId, data.address)
}

// Fetches a user's associated listings/items for display on their profile page 