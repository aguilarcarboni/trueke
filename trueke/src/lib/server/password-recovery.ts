import bcrypt from 'bcrypt'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'

const SALT_ROUNDS = 10

/** Same as registration / change password */
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[?!*&]).{8,}$/

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Dedicated names so we never clash with email-change `verification_code` / `pending_new_email` */
export const PASSWORD_RECOVERY_CODE_COOKIE = 'password_recovery_code'
export const PASSWORD_RECOVERY_EMAIL_COOKIE = 'password_recovery_email'

function generateVerificationCode(): string {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10).toString()).join('')
}

export type ForgotPasswordResult =
  | { ok: false; error: string }
  | { ok: true; code: string; normalizedEmail: string }

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

  const code = generateVerificationCode()

  const emailResult = await sendEmail({
    to: normalized,
    subject: 'Trueke - Password recovery',
    html: `
      <p>Your Trueke password recovery code is:</p>
      <p><strong>${code}</strong></p>
      <p>Use this code to recover your password: ${normalized}</p>
      <p>This code expires in 5 minutes.</p>
      <p>If you did not request this recovery, please ignore this email.</p>
    `,
  })

  if (!emailResult.ok) {
    return {
      ok: false,
      error: emailResult.error ?? 'Could not send recovery email. Check SMTP configuration.',
    }
  }

  return { ok: true, code, normalizedEmail: normalized }
}

export async function runPasswordReset(
  code: string,
  newPassword: string,
  storedCode: string | undefined,
  recoveryEmail: string | undefined
): Promise<{ error?: string; success?: string }> {
  if (!newPassword?.trim()) {
    return { error: 'New password is required.' }
  }

  if (!PASSWORD_PATTERN.test(newPassword)) {
    return {
      error:
        'New password must be 8+ characters, include 1 uppercase letter, 1 number, and 1 special character (?, !, *, &).',
    }
  }

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

  const sameAsBefore = await bcrypt.compare(newPassword, user.password_hash)
  if (sameAsBefore) {
    return { error: 'New password must be different from your current password.' }
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)

  const { error: updateError } = await supabase
    .from('user')
    .update({ password_hash: passwordHash })
    .eq('user_id', user.user_id)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath('/', 'layout')
  return { success: 'Password updated successfully.' }
}
