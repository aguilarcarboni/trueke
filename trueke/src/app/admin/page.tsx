"use client"

import { AdminSidebar } from "@/components/admin-sidebar"
import { Admin } from "@/components/sections/admin"
import { ViewSwitcher } from "@/components/view-switcher"

export default function AdminPage() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AdminSidebar activeSection="admin" onSectionChange={() => {}} />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <main className="p-4 lg:p-8">
          <Admin />
        </main>
      </div>

      {/* View Switcher for Demo */}
      <ViewSwitcher currentView="admin" />
    </div>
  )
}
