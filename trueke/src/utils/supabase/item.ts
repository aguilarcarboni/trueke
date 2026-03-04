import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getCurrentUserItems() {
  try {
    // Get session from cookies
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')

    // Check if user ID exists
    if (!userId) {
      return null
    }

    // Create Supabase client
    const supabase = await createClient()

    // Query items owned by user, excluding deleted items
    const { data: items, error } = await supabase
      .from('item')
      .select('*')
      .eq('owner_user_id', userId.value)
      .neq('status', 'deleted')
      .order('last_date_uploaded', { ascending: false })

    if (error) {
      console.error('Error fetching user items:', error)
      return null
    }

    return items
  } catch (error) {
    console.error('Get current user items error:', error)
    return null
  }
}