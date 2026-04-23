"use client"

import { AdminReportsList } from "@/components/admin/admin-reports-list"
import { AdminAnalytics } from "@/components/admin/admin-analytics"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function Admin() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Manage and review platform activity.</p>
      </div>
      <Tabs defaultValue="reports" className="w-full">
        <TabsList>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="mt-4">
          <AdminReportsList />
        </TabsContent>
        <TabsContent value="analytics" className="mt-4">
          <AdminAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}
