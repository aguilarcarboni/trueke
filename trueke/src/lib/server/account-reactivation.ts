import { createClient } from '@/utils/supabase/server'
import { EMAIL_PATTERN } from '@/lib/validation/email'
import { generateSixDigitCode } from '@/lib/server/verification-code'
import { sendReactivationCodeEmail } from '@/lib/server/mail/account-emails'
import { handleUserStatusChange } from '@/lib/server/handle-user-status-change'

export const REACTIVATION_CODE_COOKIE = 'account_reactivation_code'
export const REACTIVATION_EMAIL_COOKIE = 'account_reactivation_email'

export type ReactivationRequestResult =
  | { ok: false; error: string }
  | { ok: true; code: string; normalizedEmail: string }

/**
 * Validates that the email belongs to an inactive account within the 30-day
 * window, then sends a 6-digit code to that address.
 */
export async function runReactivationRequest(email: string): Promise<ReactivationRequestResult> {
  const normalized = String(email ?? '').trim().toLowerCase()

  if (!normalized) return { ok: false, error: 'Email is required.' }
  if (!EMAIL_PATTERN.test(normalized)) {
    return { ok: false, error: 'Please provide a valid email address.' }
  }

  const supabase = await createClient()
  const { data: user } = await supabase
    .from('user')
    .select('user_id, status, deactivated_at')
    .eq('email', normalized)
    .maybeSingle()

  if (!user) return { ok: false, error: 'No account found for this email.' }
  if (user.status !== 'inactive') return { ok: false, error: 'This account is not deactivated.' }

  const deactivatedAt = user.deactivated_at ? new Date(user.deactivated_at) : null
  const expiryDate = deactivatedAt ? new Date(deactivatedAt) : null
  if (expiryDate) expiryDate.setDate(expiryDate.getDate() + 30)
  if (!expiryDate || new Date() > expiryDate) {
    return { ok: false, error: 'The reactivation window has expired.' }
  }

  const code = generateSixDigitCode()
  const emailResult = await sendReactivationCodeEmail(normalized, code)
  if (!emailResult.ok) {
    return { ok: false, error: emailResult.error ?? 'Could not send reactivation email.' }
  }

  return { ok: true, code, normalizedEmail: normalized }
}

/**
 * Validates the code from the cookie, then reactivates the account.
 */
export async function runReactivationConfirm(
  code: string,
  storedCode: string | undefined,
  storedEmail: string | undefined,
): Promise<{ error?: string; success?: string }> {
  if (!storedCode || !storedEmail) {
    return { error: 'Code expired or missing. Please request a new reactivation code.' }
  }

  if (String(code).trim() !== String(storedCode).trim()) {
    return { error: 'Invalid verification code.' }
  }

  const supabase = await createClient()
  const { data: user } = await supabase
    .from('user')
    .select('user_id')
    .eq('email', storedEmail)
    .maybeSingle()

  if (!user) return { error: 'Account not found.' }

  const { error } = await handleUserStatusChange(user.user_id, 'active')
  if (error) return { error: 'Could not reactivate account.' }

  return { success: 'Your account has been successfully reactivated.' }
}
