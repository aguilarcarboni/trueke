"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminMobileHeader } from "@/components/admin-mobile-header"
import { Admin } from "@/components/sections/admin"
import { Profile } from "@/components/sections/profile"
import { ViewSwitcher } from "@/components/view-switcher"
import type { UserProfile } from "@/utils/supabase/tables/profile"

interface AdminPageClientProps {
  user: {
    id: string
    email?: string
    name?: string
    avatar?: string
  }
  profile: UserProfile | null
}

export function AdminPageClient({ user, profile }: AdminPageClientProps) {
  const [activeSection, setActiveSection] = useState("admin")

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <Profile profile={profile} />
      default:
        return <Admin />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          user={user}
          profile={profile}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <AdminMobileHeader user={user} />
        <main className="p-4 lg:p-8">
          {renderSection()}
        </main>
      </div>

      {/* View Switcher for Demo */}
      <ViewSwitcher currentView="admin" />
    </div>
  )
}
