"use server"

import { cookies } from "next/headers"
import { updateUserProfile, type UpdateProfileData } from "@/utils/supabase/tables/profile"

export async function updateProfileAction(
  data: UpdateProfileData
): Promise<{ error: string | null }> {
  const cookieStore = await cookies()
  const userId = cookieStore.get("user_id")

  if (!userId?.value) {
    return { error: "Not authenticated" }
  }

  return updateUserProfile(userId.value, data)
}
