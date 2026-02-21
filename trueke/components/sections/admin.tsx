"use client"

import { Shield, Users, AlertTriangle, FileText, Activity, Ban, Eye, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { users } from "@/lib/data"

const reports = [
  { id: "r1", reporter: users[0], reported: users[3], reason: "Misleading item description", status: "pending", date: "2026-02-15" },
  { id: "r2", reporter: users[1], reported: users[4], reason: "Failed to complete agreed trade", status: "reviewing", date: "2026-02-14" },
  { id: "r3", reporter: users[2], reported: users[1], reason: "Inappropriate messages", status: "resolved", date: "2026-02-10" },
]

const auditLogs = [
  { id: "a1", action: "User banned", target: "Spam Account #231", admin: "System", time: "2 hours ago" },
  { id: "a2", action: "Item removed", target: "Suspicious listing #892", admin: "Admin", time: "5 hours ago" },
  { id: "a3", action: "Trade reversed", target: "Exchange #445", admin: "Admin", time: "1 day ago" },
  { id: "a4", action: "Report resolved", target: "Report #r3", admin: "Admin", time: "1 day ago" },
  { id: "a5", action: "User warned", target: "Diego Morales", admin: "Admin", time: "3 days ago" },
]

const adminStats = [
  { label: "Total Users", value: "1,247", icon: Users, trend: "+12%" },
  { label: "Active Reports", value: "8", icon: AlertTriangle, trend: "-3" },
  { label: "Trades Today", value: "34", icon: Activity, trend: "+8%" },
  { label: "Banned Users", value: "15", icon: Ban, trend: "+2" },
]

const statusStyles: Record<string, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  reviewing: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-success/10 text-success border-success/20",
}

export function Admin() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-0.5">Moderate content and manage the platform.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {adminStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-primary mt-0.5">{stat.trend}</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Reports ({reports.filter(r => r.status !== "resolved").length})</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Reports */}
        <TabsContent value="reports" className="mt-6 space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-card-foreground">{report.reason}</p>
                        <Badge className={`text-xs border ${statusStyles[report.status]}`}>
                          {report.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          Reported by:
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={report.reporter.avatar} alt={report.reporter.name} />
                            <AvatarFallback className="text-[10px]">{report.reporter.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{report.reporter.name}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          Against:
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={report.reported.avatar} alt={report.reported.name} />
                            <AvatarFallback className="text-[10px]">{report.reported.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{report.reported.name}</span>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(report.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  {report.status !== "resolved" && (
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        Review
                      </Button>
                      <Button size="sm" className="gap-1 bg-success text-success-foreground hover:bg-success/90">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Resolve
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="mt-6 space-y-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="pt-6 flex items-center gap-4">
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-card-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.location} &middot; {user.totalTrades} trades &middot; Rating: {user.rating}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm">View</Button>
                  <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">Ban</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Audit Log */}
        <TabsContent value="audit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditLogs.map((log, i) => (
                  <div key={log.id}>
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{log.action}</span>
                          {" - "}
                          <span className="text-muted-foreground">{log.target}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          By {log.admin} &middot; {log.time}
                        </p>
                      </div>
                    </div>
                    {i < auditLogs.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
