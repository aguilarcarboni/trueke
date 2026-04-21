"use client"

import { AdminReportsList } from "@/components/admin/admin-reports-list"
import { AdminUsersList } from "@/components/admin/admin-users-list"

export function Admin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage and review platform activity.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminUsersList />
        <AdminReportsList />
      </div>
    </div>
  )
}
