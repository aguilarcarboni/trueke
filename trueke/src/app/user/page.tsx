import { getCurrentUser } from '@/utils/supabase/auth'
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
  
  // Pass user data to client component
  return <UserPageClient user={user} />
}
