import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { validateChangePasswordFields } from '@/lib/validation/password'
import {
  getRecentPasswordHistoryHashes,
  hashPassword,
  isPasswordReused,
  PASSWORD_REUSE_ERROR_MESSAGE,
  passwordsMatch,
  updateUserPasswordWithHistory,
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

  const history = await getRecentPasswordHistoryHashes(supabase, userId, 3)
  if (history.error) return { error: 'Could not validate password history.' }

  const reused = await isPasswordReused(newPassword, user.password_hash, history.hashes)
  if (reused) {
    return { error: PASSWORD_REUSE_ERROR_MESSAGE }
  }

  const passwordHash = await hashPassword(newPassword)
  const persist = await updateUserPasswordWithHistory(supabase, userId, user.password_hash, passwordHash)
  if (persist.error) return { error: persist.error }

  if (user.email) {
    sendPasswordChangeNotificationEmail(user.email, new Date()).catch((err) =>
      console.error('Failed to send password change notification:', err)
    )
  }

  revalidatePath('/', 'layout')
  return {}
}
