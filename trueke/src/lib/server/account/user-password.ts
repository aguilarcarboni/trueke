import bcrypt from 'bcrypt'
import type { SupabaseClient } from '@supabase/supabase-js'

const SALT_ROUNDS = 10
export const PASSWORD_REUSE_ERROR_MESSAGE = 'You cannot reuse any of your last 3 passwords.'

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function passwordsMatch(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function getRecentPasswordHistoryHashes(
  supabase: SupabaseClient,
  userId: string,
  limit = 3
): Promise<{ hashes: string[]; error?: string }> {
  const { data, error } = await supabase
    .from('password_history')
    .select('password_hash')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { hashes: [], error: error.message }

  const hashes = (data ?? [])
    .map((row) => row.password_hash)
    .filter((hash): hash is string => Boolean(hash))

  return { hashes }
}

export async function isPasswordReused(
  newPassword: string,
  currentPasswordHash: string,
  recentHistoryHashes: string[]
): Promise<boolean> {
  const hashesToCheck = [currentPasswordHash, ...recentHistoryHashes]

  for (const hash of hashesToCheck) {
    if (await passwordsMatch(newPassword, hash)) {
      return true
    }
  }

  return false
}

export async function savePasswordToHistory(
  supabase: SupabaseClient,
  userId: string,
  oldPasswordHash: string
): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('password_history')
    .insert({ user_id: userId, password_hash: oldPasswordHash })

  if (error) return { error: error.message }
  return {}
}

export async function updateUserPasswordHash(
  supabase: SupabaseClient,
  userId: string,
  passwordHash: string
): Promise<{ error?: string }> {
  const { error } = await supabase.from('user').update({ password_hash: passwordHash }).eq('user_id', userId)
  if (error) return { error: error.message }
  return {}
}

export async function updateUserPasswordWithHistory(
  supabase: SupabaseClient,
  userId: string,
  oldPasswordHash: string,
  newPasswordHash: string
): Promise<{ error?: string }> {
  const history = await savePasswordToHistory(supabase, userId, oldPasswordHash)
  if (history.error) return { error: history.error }

  return updateUserPasswordHash(supabase, userId, newPasswordHash)
}
