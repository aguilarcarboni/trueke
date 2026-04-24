import { createClient } from '@/utils/supabase/server'
import { sendAccountDeactivationEmail } from '@/lib/server/mail/account-emails'

export type UserStatusChange = 'inactive' | 'active' | 'banned'

export async function handleUserStatusChange(
  userId: string,
  newStatus: UserStatusChange,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  switch (newStatus) {
    case 'inactive':
    case 'banned': {
      const { error } = await supabase.rpc('handle_user_status_change', {
        p_user_id: userId,
        p_new_status: newStatus,
      })
      if (error) return { error: error.message }

      if (newStatus === 'inactive') {
        const { data: user } = await supabase
          .from('user')
          .select('email, username')
          .eq('user_id', userId)
          .single()

        if (user) await sendAccountDeactivationEmail(user.email, user.username)
      }

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
}

export async function handleBanUser(
  userId: string,
  endBanDateTime: Date,
  banReason?: string,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Set ban fields atomically (status + end_ban_date_time together satisfies chk_ban_dates constraint)
  const { error: updateError } = await supabase
    .from('user')
    .update({
      status: 'banned',
      end_ban_date_time: endBanDateTime.toISOString(),
      ban_reason: banReason ?? null,
    })
    .eq('user_id', userId)

  if (updateError) return { error: updateError.message }

  // Call handleUserStatusChange to run exchange cancellation and item cleanup via RPC
  return handleUserStatusChange(userId, 'banned')
}
