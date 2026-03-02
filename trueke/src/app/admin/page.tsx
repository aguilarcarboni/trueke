import { getCurrentUser } from '@/utils/supabase/auth'
import { getUserProfile } from '@/utils/supabase/tables/profile'
import { redirect } from 'next/navigation'
import { AdminPageClient } from './admin-page-client'

export default async function AdminPage() {
  const user = await getCurrentUser()

  if (!user) redirect('/login')
  if (!user.isAdmin) redirect('/user')

  const profile = await getUserProfile(user.id)

  return <AdminPageClient user={user} profile={profile} />
}
