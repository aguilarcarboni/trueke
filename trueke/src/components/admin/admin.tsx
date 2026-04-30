"use client"

import { AdminReportsList } from "@/components/admin/admin-reports-list"
import { AdminUsersList } from "@/components/admin/admin-users-list"
import { AdminAnalytics } from "@/components/admin/admin-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage and review platform activity.</p>
      </div>
      <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <AdminUsersList initialUsers={initialUsers} initialError={initialUsersError} />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <AdminReportsList initialReports={initialReports} initialError={initialReportsError} />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <AdminAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
