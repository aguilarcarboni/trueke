"use server"

import { cookies } from "next/headers"
import { createClient } from "@/utils/supabase/server"
import bcrypt from "bcrypt"
import { revalidatePath } from "next/cache"

const SALT_ROUNDS = 10
// Mirrors registration rules: >=8 chars, 1 uppercase, 1 digit, 1 special (? ! * &)
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[?!*&]).{8,}$/

export async function resetPassword(
  code: string,
  newPassword: string
): Promise<{ error?: string; success?: string }> {
  const cookieStore = await cookies()

  if (!newPassword?.trim()) {
    return { error: "New password is required." }
  }

  if (!PASSWORD_PATTERN.test(newPassword)) {
    return {
      error:
        "New password must be 8+ characters, include 1 uppercase letter, 1 number, and 1 special character (?, !, *, &).",
    }
  }

  const storedCode = cookieStore.get("verification_code")?.value
  const recoveryEmail = cookieStore.get("recovery_email")?.value

  if (!storedCode || !recoveryEmail) {
    return { error: "Code expired or missing." }
  }

  if (storedCode !== code) {
    return { error: "Invalid verification code." }
  }

  const supabase = await createClient()

  const { data: user, error: fetchError } = await supabase
    .from("user")
    .select("user_id")
    .eq("email", recoveryEmail.toLowerCase())
    .maybeSingle()

  if (fetchError || !user) {
    return { error: "Could not find account for this email." }
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

  const { error: updateError } = await supabase
    .from("user")
    .update({ password_hash: passwordHash })
    .eq("user_id", user.user_id)

  if (updateError) {
    return { error: updateError.message }
  }

  cookieStore.delete("verification_code")
  cookieStore.delete("recovery_email")

  revalidatePath("/", "layout")
  return { success: "Password updated successfully." }
}

export async function performPasswordReset(
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const code = String(formData.get("code") ?? "").trim()
  const newPassword = String(formData.get("password") ?? "")

  if (!code) {
    return { error: "Verification code is required." }
  }

  return resetPassword(code, newPassword)
}

