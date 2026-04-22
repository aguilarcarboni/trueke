import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateChangePasswordFields } from '@/lib/validation/password'
import {
  hashPassword,
  passwordsMatch,
  updateUserPasswordHash,
} from '@/lib/server/account/user-password'
import { sendPasswordChangeNotificationEmail } from '@/lib/server/mail/account-emails'

/**
 * Orchestrates password change: validates input, verifies current password, persists new hash.
 */
export async function runChangePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
  const fieldError = validateChangePasswordFields(currentPassword, newPassword)
  if (fieldError) return { error: fieldError }

  const supabase = await createClient()
  const { data: user, error: fetchError } = await supabase
    .from('user')
    .select('password_hash, email')
    .eq('user_id', userId)
    .single()

  if (fetchError || !user) return { error: 'Could not load your account.' }

  if (!(await passwordsMatch(currentPassword, user.password_hash))) {
    return { error: 'Current password is incorrect.' }
  }

  if (await passwordsMatch(newPassword, user.password_hash)) {
    return { error: 'New password must be different from your current password.' }
  }

  const passwordHash = await hashPassword(newPassword)
  const persist = await updateUserPasswordHash(supabase, userId, passwordHash)
  if (persist.error) return { error: persist.error }

  if (user.email) {
    sendPasswordChangeNotificationEmail(user.email, new Date()).catch((err) =>
      console.error('Failed to send password change notification:', err)
    )
  }

  revalidatePath('/', 'layout')
  return {}
}
