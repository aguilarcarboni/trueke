'use server'

import { cookies } from 'next/headers'
import {
  runPasswordReset,
  PASSWORD_RECOVERY_CODE_COOKIE,
  PASSWORD_RECOVERY_EMAIL_COOKIE,
} from '@/lib/server/password-recovery'

/** @deprecated Prefer POST /api/auth/reset-password — kept for compatibility */
export async function resetPassword(code: string, newPassword: string) {
  const cookieStore = await cookies()
  const storedCode = cookieStore.get(PASSWORD_RECOVERY_CODE_COOKIE)?.value
  const recoveryEmail = cookieStore.get(PASSWORD_RECOVERY_EMAIL_COOKIE)?.value

  const out = await runPasswordReset(code, newPassword, storedCode, recoveryEmail)
  if (out.error) return { error: out.error }

  cookieStore.delete(PASSWORD_RECOVERY_CODE_COOKIE)
  cookieStore.delete(PASSWORD_RECOVERY_EMAIL_COOKIE)

  return { success: out.success }
}

export async function performPasswordReset(formData: FormData) {
  const code = String(formData.get('code') ?? '').trim()
  const newPassword = String(formData.get('password') ?? '')
  if (!code) return { error: 'Verification code is required.' }
  return resetPassword(code, newPassword)
}
