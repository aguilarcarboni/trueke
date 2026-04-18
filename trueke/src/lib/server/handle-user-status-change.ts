import { createClient } from '@/utils/supabase/server'

export type UserStatusChange = 'inactive' | 'banned'

// Requires the `handle_user_status_change` SQL function to be deployed to the DB.
export async function handleUserStatusChange(
  userId: string,
  newStatus: UserStatusChange,
): Promise<{ error?: string }> {
  const supabase = await createClient()

  switch (newStatus) {
    case 'inactive': {
      const { error } = await supabase.rpc('handle_user_status_change', {
        p_user_id: userId,
        p_new_status: newStatus,
      })
      if (error) return { error: error.message }
      return {}
    }
  }

  return {}
}
