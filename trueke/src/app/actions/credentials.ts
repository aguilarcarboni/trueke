'use server'

import { cookies } from 'next/headers'
import { getAuthenticatedUserId } from '@/utils/auth-server'
import { runChangePassword } from '@/lib/server/run-change-password'
import {
  runChangeEmailRequest,
  runConfirmEmailChange,
} from '@/lib/server/change-email'

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
  const userId = await getAuthenticatedUserId()

  if (!userId) return { error: 'Not authenticated.' }

  const storedCode = cookieStore.get('verification_code')?.value
  const pendingNewEmail = cookieStore.get('pending_new_email')?.value

  const out = await runConfirmEmailChange(userId, userInput, storedCode, pendingNewEmail)
  if (out.error) return { error: out.error }

  cookieStore.delete('verification_code')
  cookieStore.delete('pending_new_email')

  return { success: out.success }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const userId = await getAuthenticatedUserId()

  if (!userId) return { error: 'Not authenticated.' }
  return runChangePassword(userId, currentPassword, newPassword)
}

export async function changeEmail(
  currentPassword: string,
  newEmail: string
): Promise<{ error?: string; success?: string }> {
  const userId = await getAuthenticatedUserId()

  if (!userId) return { error: 'Not authenticated.' }

  const result = await runChangeEmailRequest(userId, currentPassword, newEmail)
  if (!result.ok) return { error: result.error }

  await storeTempEmailChange(result.code, result.pendingEmail)

  return { success: result.success }
}
