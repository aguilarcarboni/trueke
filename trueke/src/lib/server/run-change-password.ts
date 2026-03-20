import bcrypt from 'bcrypt'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

const SALT_ROUNDS = 10

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[?!*&]).{8,}$/

export async function runChangePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<{ error?: string }> {
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
