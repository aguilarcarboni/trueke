"use client"

import { useEffect, useState } from "react"
import { Flag, Package, RefreshCw, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { getReports } from "@/app/actions/admin"
import {
  type ReportRow,
  type ReportStatus,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_STYLES,
  formatReportReason,
} from "@/lib/entities/report"
import { AdminReportDetail } from "./admin-report-detail"

interface AdminReportsListProps {
  initialReports?: ReportRow[]
  initialError?: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function AdminReportsList({ initialReports, initialError }: AdminReportsListProps) {
  const hasInitialState = initialReports !== undefined || initialError !== undefined
  const [reports, setReports] = useState<ReportRow[]>(initialReports ?? [])
  const [loading, setLoading] = useState(!hasInitialState)
  const [error, setError] = useState<string | null>(initialError ?? null)
  const [selected, setSelected] = useState<ReportRow | null>(null)
  const showSkeleton = loading && reports.length === 0 && !error

  useEffect(() => {
    if (initialReports !== undefined) {
      setReports(initialReports)
    }
  }, [initialReports])

  useEffect(() => {
    setError(initialError ?? null)
  }, [initialError])

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
    if (!hasInitialState) {
      void fetchReports()
    }
  }, [hasInitialState])

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
          {reports.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {reports.length}
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
        {showSkeleton ? (
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
        ) : reports.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No reports found.
          </p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
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
