"use client"

import { useState } from "react"
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  FileText, 
  Activity, 
  Ban, 
  Eye, 
  CheckCircle, 
  X, 
  Clock,
  MessageSquare,
  Package,
  ArrowLeftRight,
  ChevronDown,
  Filter,
  Search,
  UserX,
  AlertCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { users, reports, type Report, type ReportStatus } from "@/lib/data"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const auditLogs = [
  { id: "a1", action: "User banned", target: "Spam Account #231", admin: "System", time: "2 hours ago" },
  { id: "a2", action: "Item removed", target: "Suspicious listing #892", admin: "Admin", time: "5 hours ago" },
  { id: "a3", action: "Trade reversed", target: "Exchange #445", admin: "Admin", time: "1 day ago" },
  { id: "a4", action: "Report resolved", target: "Report #r3", admin: "Admin", time: "1 day ago" },
  { id: "a5", action: "User warned", target: "Diego Morales", admin: "Admin", time: "3 days ago" },
]

const adminStats = [
  { label: "Total Users", value: "1,247", icon: Users, trend: "+12%" },
  { label: "Active Reports", value: reports.filter(r => r.status !== "resolved" && r.status !== "dismissed").length.toString(), icon: AlertTriangle, trend: "-3" },
  { label: "Trades Today", value: "34", icon: Activity, trend: "+8%" },
  { label: "Banned Users", value: "15", icon: Ban, trend: "+2" },
]

const statusStyles: Record<ReportStatus, string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  reviewing: "bg-primary/10 text-primary border-primary/20",
  resolved: "bg-success/10 text-success border-success/20",
  dismissed: "bg-muted text-muted-foreground border-border",
}

const reasonLabels: Record<string, string> = {
  "misleading-description": "Misleading Description",
  "failed-trade": "Failed Trade",
  "inappropriate-messages": "Inappropriate Messages",
  "fake-item": "Fake/Counterfeit Item",
  "harassment": "Harassment",
  "scam": "Scam Attempt",
  "spam": "Spam",
  "other": "Other",
}

export function Admin() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredReports = reports.filter((report) => {
    const matchesStatus = filterStatus === "all" || report.status === filterStatus
    const matchesSearch = 
      report.reporter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reported.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.reasonText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleResolveReport = (reportId: string, action: "resolve" | "dismiss") => {
    console.log(`${action} report:`, reportId)
    // In a real app, this would update the report status
  }

  const handleBanUser = (userId: string) => {
    console.log("Ban user:", userId)
    // In a real app, this would ban the user
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-0.5">Moderate content and manage user reports.</p>
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
          <TabsTrigger value="reports">
            Reports ({reports.filter(r => r.status !== "resolved" && r.status !== "dismissed").length})
          </TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        {/* Reports Tab */}
        <TabsContent value="reports" className="mt-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search reports by user or reason..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reports</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="dismissed">Dismissed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Report Details Modal */}
          {selectedReport && (
            <Card className="border-primary/50 bg-accent/5">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      Report Details
                    </CardTitle>
                    <CardDescription className="mt-1">ID: {selectedReport.id}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedReport(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Report Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reporter</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedReport.reporter.avatar} alt={selectedReport.reporter.name} />
                        <AvatarFallback>{selectedReport.reporter.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{selectedReport.reporter.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedReport.reporter.location}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Reported User</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={selectedReport.reported.avatar} alt={selectedReport.reported.name} />
                        <AvatarFallback>{selectedReport.reported.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{selectedReport.reported.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedReport.reported.location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Reason and Description */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-medium text-muted-foreground">REASON</p>
                    <Badge className={`text-xs border ${statusStyles[selectedReport.status]}`}>
                      {selectedReport.status}
                    </Badge>
                  </div>
                  <p className="font-semibold text-foreground mb-2">{reasonLabels[selectedReport.reason]}</p>
                  <p className="text-sm text-muted-foreground">{selectedReport.description}</p>
                </div>

                {/* Related Items */}
                {(selectedReport.relatedItem || selectedReport.relatedExchange) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">RELATED TO</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedReport.relatedItem && (
                          <Badge variant="outline" className="gap-1">
                            <Package className="h-3 w-3" />
                            Item: {selectedReport.relatedItem.title}
                          </Badge>
                        )}
                        {selectedReport.relatedExchange && (
                          <Badge variant="outline" className="gap-1">
                            <ArrowLeftRight className="h-3 w-3" />
                            Exchange: {selectedReport.relatedExchange.id}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Evidence */}
                {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">EVIDENCE</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {selectedReport.evidence.map((evidence, idx) => (
                          <div key={idx} className="aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                            {evidence.startsWith("http") ? (
                              <img src={evidence} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" />
                            ) : (
                              <p className="text-xs text-muted-foreground">{evidence}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Admin Notes */}
                {selectedReport.adminNotes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">ADMIN NOTES</p>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm">{selectedReport.adminNotes}</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Resolution Info */}
                {selectedReport.status === "resolved" && selectedReport.resolvedBy && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">RESOLUTION</p>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span>Resolved by {selectedReport.resolvedBy} on {new Date(selectedReport.resolvedDate!).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Report Date */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Reported on {new Date(selectedReport.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </div>

                {/* Actions */}
                {selectedReport.status !== "resolved" && selectedReport.status !== "dismissed" && (
                  <>
                    <Separator />
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        className="gap-2"
                        onClick={() => handleBanUser(selectedReport.reported.id)}
                      >
                        <UserX className="h-4 w-4" />
                        Ban User
                      </Button>
                      <Button 
                        variant="outline" 
                        className="gap-2 text-muted-foreground"
                        onClick={() => handleResolveReport(selectedReport.id, "dismiss")}
                      >
                        <X className="h-4 w-4" />
                        Dismiss Report
                      </Button>
                      <Button 
                        className="gap-2 bg-success text-success-foreground hover:bg-success/90 ml-auto"
                        onClick={() => handleResolveReport(selectedReport.id, "resolve")}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Resolve Report
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No reports found matching your filters.</p>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report) => (
              <Card 
                key={report.id} 
                className={`cursor-pointer transition-colors hover:bg-accent/5 ${selectedReport?.id === report.id ? "border-primary" : ""}`}
                onClick={() => setSelectedReport(report)}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${
                        report.status === "pending" ? "text-warning" : 
                        report.status === "reviewing" ? "text-primary" : 
                        "text-muted-foreground"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <p className="font-semibold text-card-foreground">{reasonLabels[report.reason]}</p>
                          <Badge className={`text-xs border ${statusStyles[report.status]}`}>
                            {report.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{report.description}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={report.reporter.avatar} alt={report.reporter.name} />
                              <AvatarFallback className="text-[10px]">{report.reporter.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{report.reporter.name}</span>
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="flex items-center gap-1.5">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={report.reported.avatar} alt={report.reported.name} />
                              <AvatarFallback className="text-[10px]">{report.reported.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground">{report.reported.name}</span>
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(report.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    {report.status !== "resolved" && report.status !== "dismissed" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-1 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedReport(report)
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    onClick={() => handleBanUser(user.id)}
                  >
                    Ban
                  </Button>
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
