"use server"

import type { UpdateProfileData, UserProfile, PublicUserProfile, PublicProfileResult } from "@/lib/entities/profile"
import { getUserProfile, updateUserProfile, getPublicUserProfile } from "@/utils/entities/profile"

export async function getProfileAction(userId: string): Promise<UserProfile | null> {
  if (!userId?.trim()) return null
  return getUserProfile(userId)
}

/**
 * Returns a privacy-safe public profile for any user.
 * Safe to call from client code — no sensitive data is exposed.
 */
export async function getPublicProfileAction(userId: string): Promise<PublicProfileResult | null> {
  if (!userId?.trim()) return null
  return getPublicUserProfile(userId)
}

export async function updateProfileAction(userId: string, data: UpdateProfileData): Promise<{ error: string | null }> {
  if (!userId?.trim()) {
    return { error: "User not authenticated." }
  }
  return updateUserProfile(userId, data)
}
