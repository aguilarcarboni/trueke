"use client"

import { useEffect, useMemo, useState } from "react"
import { Flag, Package, RefreshCw, Search, User, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { getReports } from "@/app/actions/admin"
import {
  type ReportRow,
  type ReportStatus,
  type ReportTargetType,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_STYLES,
  REPORT_TARGET_TYPE_LABELS,
  formatReportReason,
} from "@/lib/entities/report"
import { AdminReportDetail } from "./admin-report-detail"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function AdminReportsList() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ReportRow | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | "">("")
  const [selectedTargetType, setSelectedTargetType] = useState<ReportTargetType | "">("")
  const [selectedReason, setSelectedReason] = useState("")

  const uniqueReasons = useMemo(
    () => [...new Set(reports.map((r) => r.reason))].sort(),
    [reports],
  )

  const hasActiveFilters =
    searchQuery !== "" || selectedStatus !== "" || selectedTargetType !== "" || selectedReason !== ""

  const filteredReports = useMemo(() => {
    let result = reports
    if (selectedStatus) {
      result = result.filter((r) => r.status === selectedStatus)
    }
    if (selectedTargetType) {
      result = result.filter((r) => r.target_type === selectedTargetType)
    }
    if (selectedReason) {
      result = result.filter((r) => r.reason === selectedReason)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.target_label.toLowerCase().includes(q) ||
          r.reporter_username.toLowerCase().includes(q) ||
          formatReportReason(r.reason).toLowerCase().includes(q) ||
          (r.description?.toLowerCase().includes(q) ?? false),
      )
    }
    return result
  }, [reports, searchQuery, selectedStatus, selectedTargetType, selectedReason])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedStatus("")
    setSelectedTargetType("")
    setSelectedReason("")
  }

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    const result = await getReports()
    if (result.error) {
      setError(result.error)
    } else {
      setReports(result.data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReports()
  }, [])

  if (selected) {
    return (
      <AdminReportDetail
        report={selected}
        onBack={() => setSelected(null)}
        onStatusChange={(newStatus: ReportStatus) =>
          setSelected((prev) => (prev ? { ...prev, status: newStatus } : prev))
        }
      />
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
          <Flag className="h-4 w-4" />
          Reports
          {!loading && (
            <Badge variant="secondary" className="ml-1">
              {hasActiveFilters ? `${filteredReports.length} / ${reports.length}` : reports.length}
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={fetchReports}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {/* Filter bar */}
        <div className="flex gap-2 items-center mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by target, reporter, or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={selectedStatus || "__all__"}
            onValueChange={(v) => setSelectedStatus(v === "__all__" ? "" : v as ReportStatus)}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {(Object.entries(REPORT_STATUS_LABELS) as [ReportStatus, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedTargetType || "__all__"}
            onValueChange={(v) => setSelectedTargetType(v === "__all__" ? "" : v as ReportTargetType)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All types</SelectItem>
              {(Object.entries(REPORT_TARGET_TYPE_LABELS) as [ReportTargetType, string][]).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={selectedReason || "__all__"}
            onValueChange={(v) => setSelectedReason(v === "__all__" ? "" : v)}
            disabled={uniqueReasons.length === 0}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All reasons</SelectItem>
              {uniqueReasons.map((r) => (
                <SelectItem key={r} value={r}>{formatReportReason(r)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={clearFilters} title="Clear filters">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-sm text-destructive mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchReports}>
              Retry
            </Button>
          </div>
        ) : filteredReports.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {hasActiveFilters ? "No reports match the current filters." : "No reports found."}
          </p>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((report) => (
              <button
                key={report.report_id}
                type="button"
                onClick={() => setSelected(report)}
                className="w-full text-left flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    {report.target_type === "item" ? (
                      <Package className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground truncate">
                        {report.target_label}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize shrink-0">
                        {report.target_type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">{formatReportReason(report.reason)}</span>
                      {" · Reported by "}
                      <span className="font-medium">@{report.reporter_username}</span>
                      {" · "}
                      {formatDate(report.created_at)}
                    </p>
                    {report.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 italic">
                        {report.description}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs ${REPORT_STATUS_STYLES[report.status]}`}
                >
                  {REPORT_STATUS_LABELS[report.status]}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
