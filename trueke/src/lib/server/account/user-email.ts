import type { SupabaseClient } from '@supabase/supabase-js'

export async function updateUserEmailAddress(
  supabase: SupabaseClient,
  userId: string,
  newEmail: string
): Promise<{ error?: string }> {
  const { error } = await supabase.from('user').update({ email: newEmail }).eq('user_id', userId)
  if (error) return { error: error.message }
  return {}
}
