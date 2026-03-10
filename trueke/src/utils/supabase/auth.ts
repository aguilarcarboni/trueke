import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getCurrentUser() {
  try {
    // Get session from cookies
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session_token')
    const userId = cookieStore.get('user_id')

    // Check if session exists
    if (!sessionToken || !userId) {
      return null
    }

    // Create Supabase client
    const supabase = await createClient()

    // Query custom user table
    const { data: user, error } = await supabase
      .from('user')
      .select('*')
      .eq('user_id', userId.value)
      .single()

    if (error || !user) {
      return null
    }

    // Check if user is banned
    if (user.end_ban_date_time) {
      const banEndDate = new Date(user.end_ban_date_time)
      if (banEndDate > new Date()) {
        return null
      }
    }

    // Return simplified user object
    return {
      id: user.user_id,
      email: user.email || '',
      name: user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      avatar: user.profile_picture_url,
      isAdmin: user.is_admin || false,
      bio: user.bio,
      status: user.status,
      createdAt: user.created_at,
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}
