"use server"

import type { UpdateProfileData, UserProfile } from "@/utils/supabase/tables/profile"
import { getUserProfile, updateUserProfile } from "@/utils/supabase/tables/profile"

export async function getProfileAction(userId: string): Promise<UserProfile | null> {
  if (!userId?.trim()) return null
  return getUserProfile(userId)
}

export async function updateProfileAction(
  userId: string,
  data: UpdateProfileData
): Promise<{ error: string | null }> {
  if (!userId?.trim()) {
    return { error: "User not authenticated." }
  }

  return updateUserProfile(userId, data)
}
