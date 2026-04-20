import { createClient } from '@/utils/supabase/server'
import { sendAccountDeactivationEmail } from '@/lib/server/mail/account-emails'

export type UserStatusChange = 'inactive' | 'active' | 'banned'


export async function handleUserStatusChange(
  userId: string,
  newStatus: UserStatusChange,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  switch (newStatus) {
    case 'inactive': {
      const { data: user, error: fetchError } = await supabase
        .from('user')
        .select('email, username')
        .eq('user_id', userId)
        .single()

      if (fetchError || !user) return { error: 'Could not load user account.' }

      const { error } = await supabase.rpc('handle_user_status_change', {
        p_user_id: userId,
        p_new_status: newStatus,
      })
      if (error) return { error: error.message }

      await sendAccountDeactivationEmail(user.email, user.username)
      return {}
    }
    case 'active': {
      const { error } = await supabase.rpc('handle_user_status_change', {
        p_user_id: userId,
        p_new_status: newStatus,
      })
      if (error) {
        console.error('[reactivate] RPC error:', error)
        return { error: error.message }
      }
      return {}
    }
  }

  return {}
}
