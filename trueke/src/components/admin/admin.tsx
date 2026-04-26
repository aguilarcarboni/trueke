"use client"

import { AdminReportsList } from "@/components/admin/admin-reports-list"
import { AdminUsersList } from "@/components/admin/admin-users-list"
import type { ReportRow } from "@/lib/entities/report"

type AdminUser = { user_id: string; username: string; status: string }

interface AdminProps {
  initialUsers?: AdminUser[]
  initialUsersError?: string | null
  initialReports?: ReportRow[]
  initialReportsError?: string | null
}

export function Admin({
  initialUsers,
  initialUsersError,
  initialReports,
  initialReportsError,
}: AdminProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage and review platform activity.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminUsersList initialUsers={initialUsers} initialError={initialUsersError} />
        <AdminReportsList initialReports={initialReports} initialError={initialReportsError} />
      </div>
    </div>
  )
}
