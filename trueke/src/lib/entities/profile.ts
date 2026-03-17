
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
  profile_picture_url: string
  address: UserAddress | null
  isAdmin: boolean
  created_at: string
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