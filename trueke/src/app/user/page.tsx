import { getCurrentUser } from '@/utils/supabase/auth'
import { getCurrentUserItems } from '@/utils/supabase/item'
import { getUserProfile } from '@/utils/supabase/tables/profile'
import { redirect } from 'next/navigation'
import { UserPageClient } from '@/app/user/user-page-client'

export default async function UserPage() {
  // Check if user is logged in
  const user = await getCurrentUser()
  
  // If not logged in, redirect to login page
  if (!user) {
    redirect('/login')
  }
  
  // Check if user is admin - admins should use admin view
  if (user.isAdmin) {
    redirect('/admin')
  }

  // Fetch full profile data (includes location from address table)
  const profile = await getUserProfile(user.id)
  
  // Fetch user items from database
  const userItems = await getCurrentUserItems()
  
  // Pass user data, profile, and items to client component
  return <UserPageClient user={user} profile={profile} userItems={userItems} />
}
