import bcrypt from 'bcrypt'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateVerificationCode(): string {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 10).toString()
  ).join('')
}

export type ChangeEmailRequestResult =
  | { ok: false; error: string }
  | { ok: true; success: string; code: string; pendingEmail: string }

/**
 * Validates password, checks email availability, sends verification email.
 * Returns `code` + `pendingEmail` for the Route Handler to store in httpOnly cookies (never expose in JSON).
 */
export async function runChangeEmailRequest(
  userId: string,
  currentPassword: string,
  newEmail: string
): Promise<ChangeEmailRequestResult> {
  if (!currentPassword?.trim()) return { ok: false, error: 'Current password is required.' }

  const trimmed = newEmail?.trim().toLowerCase()
  if (!trimmed) return { ok: false, error: 'New email is required.' }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { ok: false, error: 'Please provide a valid email address.' }
  }

  const supabase = await createClient()
  const { data: user, error: fetchError } = await supabase
    .from('user')
    .select('password_hash, email')
    .eq('user_id', userId)
    .single()

  if (fetchError || !user) return { ok: false, error: 'Could not load your account.' }

  const match = await bcrypt.compare(currentPassword, user.password_hash)
  if (!match) return { ok: false, error: 'Current password is incorrect.' }

  if (user.email?.toLowerCase() === trimmed) {
    return { ok: false, error: 'New email is the same as your current email.' }
  }

  const { data: existing, error: existingError } = await supabase
    .from('user')
    .select('user_id')
    .eq('email', trimmed)
    .neq('user_id', userId)
    .maybeSingle()

  if (existingError) return { ok: false, error: 'Could not validate the new email.' }
  if (existing) return { ok: false, error: 'Email already in use.' }

  const code = generateVerificationCode()

  const emailResult = await sendEmail({
    to: trimmed,
    subject: 'Trueke - Email change confirmation',
    html: `
      <p>Your Trueke email change verification code is:</p>
      <p><strong>${code}</strong></p>
      <p>Use this code to confirm your new email: ${trimmed}</p>
      <p>This code expires in 5 minutes.</p>
      <p>If you did not request this change, please ignore this email.</p>
    `,
  })

  if (!emailResult.ok) {
    return {
      ok: false,
      error: emailResult.error ?? 'Could not send verification email.',
    }
  }

  return {
    ok: true,
    success: 'Verification code sent to your new email.',
    code,
    pendingEmail: trimmed,
  }
}

export async function runConfirmEmailChange(
  userId: string,
  userInput: string,
  storedCode: string | undefined,
  pendingNewEmail: string | undefined
): Promise<{ error?: string; success?: string }> {
  if (!storedCode || !pendingNewEmail) {
    return { error: 'Code expired or missing.' }
  }

  if (!userInput?.trim()) {
    return { error: 'Verification code is required.' }
  }

  if (userInput.trim() !== storedCode) {
    return { error: 'Invalid verification code.' }
  }

  const supabase = await createClient()

  const { data: existing, error: existingError } = await supabase
    .from('user')
    .select('user_id')
    .eq('email', pendingNewEmail)
    .neq('user_id', userId)
    .maybeSingle()

  if (existingError) return { error: 'Could not validate the email.' }
  if (existing) return { error: 'Email already in use.' }

  const { error: updateError } = await supabase
    .from('user')
    .update({ email: pendingNewEmail })
    .eq('user_id', userId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/', 'layout')
  return { success: 'Email updated successfully.' }
}
