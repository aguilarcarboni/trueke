'use server'

import { cookies } from 'next/headers'
import {
  runForgotPassword,
  PASSWORD_RECOVERY_CODE_COOKIE,
  PASSWORD_RECOVERY_EMAIL_COOKIE,
} from '@/lib/server/password-recovery'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 5,
  path: '/',
}

/** @deprecated Prefer POST /api/auth/forgot-password — kept for compatibility */
export async function recoverPassword(email: string) {
  const result = await runForgotPassword(email)
  if (!result.ok) return { error: result.error }

  const cookieStore = await cookies()
  cookieStore.set(PASSWORD_RECOVERY_CODE_COOKIE, result.code, COOKIE_OPTS)
  cookieStore.set(PASSWORD_RECOVERY_EMAIL_COOKIE, result.normalizedEmail, COOKIE_OPTS)

  return { success: 'Recovery code sent to your email.' }
}

export async function sendRecoveryEmail(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  if (!email) return { error: 'Email is required.' }
  return recoverPassword(email)
}
