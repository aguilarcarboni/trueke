"use client"

import { AdminReportsList } from "@/components/admin/admin-reports-list"

export function Admin() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage and review platform activity.</p>
      </div>
      <AdminReportsList />
    </div>
  )
}
