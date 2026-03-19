'use server'

import { cookies } from 'next/headers'
import bcrypt from 'bcrypt'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email'

const SALT_ROUNDS = 10
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Mirrors registration rules: >=8 chars, 1 uppercase, 1 digit, 1 special (? ! * &)
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[?!*&]).{8,}$/

function generateVerificationCode(): string {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 10).toString()
  ).join('')
}

export async function storeTempEmailChange(code: string, newEmail: string) {
  const cookieStore = await cookies()

  cookieStore.set('verification_code', code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5,
    path: '/',
  })

  cookieStore.set('pending_new_email', newEmail, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5,
    path: '/',
  })
}

export async function confirmEmailChange(
  userInput: string
): Promise<{ error?: string; success?: string }> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value

  if (!userId) return { error: 'Not authenticated.' }

  const storedCode = cookieStore.get('verification_code')?.value
  const pendingNewEmail = cookieStore.get('pending_new_email')?.value

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

  cookieStore.delete('verification_code')
  cookieStore.delete('pending_new_email')

  revalidatePath('/', 'layout')
  return { success: 'Email updated successfully.' }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value

  if (!userId) return { error: 'Not authenticated.' }
  if (!currentPassword?.trim()) return { error: 'Current password is required.' }
  if (!newPassword?.trim()) return { error: 'New password is required.' }

  if (!PASSWORD_PATTERN.test(newPassword)) {
    return {
      error:
        'New password must be 8+ characters, include 1 uppercase letter, 1 number, and 1 special character (?, !, *, &).',
    }
  }

  const supabase = await createClient()
  const { data: user, error: fetchError } = await supabase
    .from('user')
    .select('password_hash')
    .eq('user_id', userId)
    .single()

  if (fetchError || !user) return { error: 'Could not load your account.' }

  const match = await bcrypt.compare(currentPassword, user.password_hash)
  if (!match) return { error: 'Current password is incorrect.' }

  const isSameAsCurrent = await bcrypt.compare(newPassword, user.password_hash)
  if (isSameAsCurrent) {
    return { error: 'New password must be different from your current password.' }
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
  const { error: updateError } = await supabase
    .from('user')
    .update({ password_hash: passwordHash })
    .eq('user_id', userId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/', 'layout')
  return {}
}

export async function changeEmail(
  currentPassword: string,
  newEmail: string
): Promise<{ error?: string; success?: string }> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value

  if (!userId) return { error: 'Not authenticated.' }
  if (!currentPassword?.trim()) return { error: 'Current password is required.' }

  const trimmed = newEmail?.trim().toLowerCase()
  if (!trimmed) return { error: 'New email is required.' }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return { error: 'Please provide a valid email address.' }
  }

  const supabase = await createClient()
  const { data: user, error: fetchError } = await supabase
    .from('user')
    .select('password_hash, email')
    .eq('user_id', userId)
    .single()

  if (fetchError || !user) return { error: 'Could not load your account.' }

  const match = await bcrypt.compare(currentPassword, user.password_hash)
  if (!match) return { error: 'Current password is incorrect.' }

  if (user.email?.toLowerCase() === trimmed) {
    return { error: 'New email is the same as your current email.' }
  }

  const { data: existing, error: existingError } = await supabase
    .from('user')
    .select('user_id')
    .eq('email', trimmed)
    .neq('user_id', userId)
    .maybeSingle()

  if (existingError) return { error: 'Could not validate the new email.' }
  if (existing) return { error: 'Email already in use.' }

  const code = generateVerificationCode()

  await storeTempEmailChange(code, trimmed)

  await sendEmail({
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

  return { success: 'Verification code sent to your new email.' }
}