import { createClient } from "@/utils/supabase/server"
import { LETTERS_ONLY, ALPHANUMERIC, AddressSchema } from "@/lib/entities/address"
import { getLinkedAddress, upsertUserAddress } from "@/utils/entities/address"
import { UpdateProfileData, UserProfile } from "@/lib/entities/profile"


// Fetches the user's profile information, including their current address if available
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from("user")
    .select(
      "user_id,email,username,first_name,last_name,bio,profile_picture_url,is_admin,created_at,status"
    )
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle()

  if (error || !user) return null

  const address = await getLinkedAddress(userId)

  return {
    id: user.user_id,
    email: user.email,
    username: user.username,
    firstName: user.first_name,
    lastName: user.last_name,
    bio: user.bio || "",
    profile_picture_url: user.profile_picture_url || "",
    address,
    isAdmin: user.is_admin,
    created_at: user.created_at,
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
export async function updateUserProfile(userId: string, data: UpdateProfileData): Promise<{ error: string | null }> {
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