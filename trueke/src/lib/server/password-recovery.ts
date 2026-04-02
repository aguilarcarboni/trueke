import bcrypt from 'bcrypt'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { EMAIL_PATTERN } from '@/lib/validation/email'
import { validateNewPasswordField } from '@/lib/validation/password'
import { generateSixDigitCode } from '@/lib/server/verification-code'
import { sendPasswordRecoveryEmail } from '@/lib/server/mail/account-emails'
import {
  hashPassword,
  passwordsMatch,
  updateUserPasswordHash,
} from '@/lib/server/account/user-password'

export { EMAIL_PATTERN }

/** Dedicated names so we never clash with email-change cookies */
export const PASSWORD_RECOVERY_CODE_COOKIE = 'password_recovery_code'
export const PASSWORD_RECOVERY_EMAIL_COOKIE = 'password_recovery_email'

export type ForgotPasswordResult =
  | { ok: false; error: string }
  | { ok: true; code: string; normalizedEmail: string }

/**
 * Looks up user by email and sends recovery code (orchestration only).
 */
export async function runForgotPassword(email: string): Promise<ForgotPasswordResult> {
  const normalized = String(email ?? '').trim().toLowerCase()

  if (!normalized) return { ok: false, error: 'Email is required.' }
  if (!EMAIL_PATTERN.test(normalized)) {
    return { ok: false, error: 'Please provide a valid email address.' }
  }

  const supabase = await createClient()
  const { data: user, error } = await supabase
    .from('user')
    .select('user_id')
    .eq('email', normalized)
    .maybeSingle()

  if (error || !user) {
    return { ok: false, error: 'Could not find account for this email.' }
  }

  const code = generateSixDigitCode()
  const emailResult = await sendPasswordRecoveryEmail(normalized, code, normalized)

  if (!emailResult.ok) {
    return {
      ok: false,
      error: emailResult.error ?? 'Could not send recovery email. Check SMTP configuration.',
    }
  }

  return { ok: true, code, normalizedEmail: normalized }
}

/**
 * Validates code + session cookies, ensures new password differs, persists hash.
 */
export async function runPasswordReset(
  code: string,
  newPassword: string,
  storedCode: string | undefined,
  recoveryEmail: string | undefined
): Promise<{ error?: string; success?: string }> {
  const formatError = validateNewPasswordField(newPassword)
  if (formatError) return { error: formatError }

  if (!storedCode || !recoveryEmail) {
    return { error: 'Code expired or missing. Request a new code from Forgot password.' }
  }

  const a = String(code).trim()
  const b = String(storedCode).trim()
  if (a !== b) {
    return { error: 'Invalid verification code.' }
  }

  const supabase = await createClient()

  const { data: user, error: fetchError } = await supabase
    .from('user')
    .select('user_id, password_hash')
    .eq('email', recoveryEmail.toLowerCase())
    .maybeSingle()

  if (fetchError || !user) {
    return { error: 'Could not find account for this email.' }
  }

  if (await passwordsMatch(newPassword, user.password_hash)) {
    return { error: 'New password must be different from your current password.' }
  }

  const passwordHash = await hashPassword(newPassword)
  const persist = await updateUserPasswordHash(supabase, user.user_id, passwordHash)
  if (persist.error) {
    return { error: persist.error }
  }

  revalidatePath('/', 'layout')
  return { success: 'Password updated successfully.' }
}
