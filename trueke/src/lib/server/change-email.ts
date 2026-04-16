import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { EMAIL_PATTERN } from '@/lib/validation/email'
import { generateSixDigitCode } from '@/lib/server/verification-code'
import {
  sendEmailChangeVerificationEmail,
  sendEmailChangeNotificationToOldEmail,
  sendEmailChangeConfirmationToNewEmail,
} from '@/lib/server/mail/account-emails'
import { updateUserEmailAddress } from '@/lib/server/account/user-email'
import { passwordsMatch } from '@/lib/server/account/user-password'

export { EMAIL_PATTERN }

export type ChangeEmailRequestResult =
  | { ok: false; error: string }
  | { ok: true; success: string; code: string; pendingEmail: string }

/**
 * Orchestrates email-change request: verifies password, checks availability, sends code.
 * Returns `code` + `pendingEmail` for Route Handler cookies only (not JSON).
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

  if (!(await passwordsMatch(currentPassword, user.password_hash))) {
    return { ok: false, error: 'Current password is incorrect.' }
  }

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

  const code = generateSixDigitCode()
  const emailResult = await sendEmailChangeVerificationEmail(trimmed, code, trimmed)

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

  const { data: currentUser, error: userError } = await supabase
    .from('user')
    .select('email')
    .eq('user_id', userId)
    .single()

  const oldEmail = currentUser?.email as string | undefined

  const { data: existing, error: existingError } = await supabase
    .from('user')
    .select('user_id')
    .eq('email', pendingNewEmail)
    .neq('user_id', userId)
    .maybeSingle()

  if (existingError) return { error: 'Could not validate the email.' }
  if (existing) return { error: 'Email already in use.' }

  const persist = await updateUserEmailAddress(supabase, userId, pendingNewEmail)
  if (persist.error) return { error: persist.error }

  const changedAt = new Date()
  if (oldEmail) {
    sendEmailChangeNotificationToOldEmail(oldEmail, pendingNewEmail, changedAt).catch((err) =>
      console.error('Failed to send email change notification to old email:', err)
    )
  }
  sendEmailChangeConfirmationToNewEmail(pendingNewEmail).catch((err) =>
    console.error('Failed to send email change confirmation to new email:', err)
  )

  revalidatePath('/', 'layout')
  return { success: 'Email updated successfully.' }
}
