'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from '@/lib/email'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function generateVerificationCode(): string {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10).toString()).join('')
}

async function enterEmail(email: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: user, error } = await supabase
    .from('user')
    .select('user_id')
    .eq('email', email)
    .maybeSingle()

  if (error || !user) {
    return { error: 'Could not find account for this email.' }
  }

  return {}
}

async function storeTempCode(code: string) {
  const cookieStore = await cookies()
  cookieStore.set('verification_code', code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5,
    path: '/',
  })
}

export async function recoverPassword(email: string): Promise<{ error?: string; success?: string }> {
  const normalized = String(email ?? '').trim().toLowerCase()

  if (!normalized) {
    return { error: 'Email is required.' }
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return { error: 'Please provide a valid email address.' }
  }

  const { error } = await enterEmail(normalized)
  if (error) return { error }
  const code = generateVerificationCode()
  await storeTempCode(code)

  const cookieStore = await cookies()
  cookieStore.set('recovery_email', normalized, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 5,
    path: '/',
  })

  await sendEmail({
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
  return { success: 'Recovery code sent to your email.' }
}

export async function sendRecoveryEmail(
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()

  if (!email) {
    return { error: 'Email is required.' }
  }

  return recoverPassword(email)
}