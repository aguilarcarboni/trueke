import { getCurrentUser } from '@/utils/supabase/auth'
import { redirect } from 'next/navigation'

export default async function Home() {
  // Check if user is logged in
  const user = await getCurrentUser()
  
  // If not logged in, redirect to login
  if (!user) {
    redirect('/login')
  }
  
  // Redirect based on user role
  if (user.isAdmin) {
    redirect('/admin')
  } else {
    redirect('/user')
  }
}

