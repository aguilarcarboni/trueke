import bcrypt from 'bcrypt'
import type { SupabaseClient } from '@supabase/supabase-js'

const SALT_ROUNDS = 10

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function passwordsMatch(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
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
