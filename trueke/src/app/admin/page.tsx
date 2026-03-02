import { getCurrentUser } from '@/utils/supabase/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { Admin } from "@/components/sections/admin"
import { ViewSwitcher } from "@/components/view-switcher"

export default async function AdminPage() {
  // Check if user is logged in
  const user = await getCurrentUser()
  
  // If not logged in, redirect to login page
  if (!user) {
    redirect('/login')
  }
  
  // Check if user is admin - only admins can access this page
  if (!user.isAdmin) {
    redirect('/user')
  }
  
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <AdminHeader user={user} />
        <main className="p-4 lg:p-8">
          <Admin />
        </main>
      </div>

      {/* View Switcher for Demo */}
      <ViewSwitcher currentView="admin" />
    </div>
  )
}
