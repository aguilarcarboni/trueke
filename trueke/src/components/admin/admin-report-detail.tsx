"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Flag, Package, Star, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { getReportTargetDetails, updateReportStatus } from "@/app/actions/admin"
import {
  type ReportRow,
  type ReportStatus,
  type ReportTargetDetails,
  type ReporterStatus,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_STYLES,
  REPORTER_STATUS_LABELS,
  REPORTER_STATUS_STYLES,
  formatReportReason,
} from "@/lib/entities/report"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const STATUS_ORDER: ReportStatus[] = ["open", "reviewed", "resolved"]

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3 text-center">
      <p className="text-sm font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

function TargetDetails({ details }: { details: ReportTargetDetails }) {
  if (details.kind === "user") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-card-foreground">@{details.username}</p>
            <Badge variant="outline" className="text-xs mt-1">User</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatBox
            label="Reports against"
            value={String(details.report_count)}
          />
          <StatBox
            label="Avg. rating"
            value={
              details.avg_rating !== null
                ? `${details.avg_rating} / 5`
                : "No ratings"
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <Package className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-semibold text-card-foreground">{details.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">Item</Badge>
            <Badge variant="secondary" className="text-xs capitalize">{details.status}</Badge>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Owner" value={`@${details.owner_username}`} />
        <StatBox label="Reports against" value={String(details.report_count)} />
      </div>
    </div>
  )
}

interface AdminReportDetailProps {
  report: ReportRow
  onBack: () => void
  onStatusChange?: (newStatus: ReportStatus) => void
}

export function AdminReportDetail({
  report,
  onBack,
  onStatusChange,
}: AdminReportDetailProps) {
  const [status, setStatus] = useState<ReportStatus>(report.status)
  const [updating, setUpdating] = useState(false)
  const [targetDetails, setTargetDetails] = useState<ReportTargetDetails | null>(null)
  const [targetLoading, setTargetLoading] = useState(true)
  const [targetError, setTargetError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    let cancelled = false
    setTargetLoading(true)
    setTargetError(null)
    getReportTargetDetails(report.target_type, report.target_id).then((result) => {
      if (cancelled) return
      if (result.error) {
        setTargetError(result.error)
      } else {
        setTargetDetails(result.data ?? null)
      }
      setTargetLoading(false)
    })
    return () => { cancelled = true }
  }, [report.target_type, report.target_id])

  const handleStatusChange = async (newStatus: ReportStatus) => {
    if (newStatus === status || updating) return
    setUpdating(true)
    const result = await updateReportStatus(report.report_id, newStatus)
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    } else {
      setStatus(newStatus)
      onStatusChange?.(newStatus)
      toast({
        title: "Status updated",
        description: `Report marked as ${REPORT_STATUS_LABELS[newStatus]}.`,
      })
    }
    setUpdating(false)
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Reports
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-card-foreground">
                    {formatReportReason(report.reason)}
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    Submitted on {formatDate(report.created_at)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={`text-sm ${REPORT_STATUS_STYLES[status]}`}
                >
                  {REPORT_STATUS_LABELS[status]}
                </Badge>
              </div>

              {/* Description */}
              {report.description && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-card-foreground mb-2">
                      Description
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {report.description}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              {/* Reported Target */}
              <div>
                <h3 className="text-sm font-semibold text-card-foreground mb-3">
                  Reported Target
                </h3>
                {targetLoading ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Skeleton className="h-14 rounded-lg" />
                      <Skeleton className="h-14 rounded-lg" />
                    </div>
                  </div>
                ) : targetError ? (
                  <p className="text-sm text-destructive">{targetError}</p>
                ) : targetDetails ? (
                  <TargetDetails details={targetDetails} />
                ) : null}
              </div>

              <Separator />

              {/* Reported By */}
              <div>
                <h3 className="text-sm font-semibold text-card-foreground mb-3">
                  Reported By
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-card-foreground">@{report.reporter_username}</p>
                      <Badge
                        variant="outline"
                        className={`text-xs mt-1 ${REPORTER_STATUS_STYLES[report.reporter_status]}`}
                      >
                        {REPORTER_STATUS_LABELS[report.reporter_status]}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <StatBox
                      label="Member since"
                      value={new Date(report.reporter_created_at).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                    />
                    <StatBox
                      label="Reports filed"
                      value={String(report.reporter_total_reports)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base text-card-foreground flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Update Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {STATUS_ORDER.map((s) => (
                <Button
                  key={s}
                  variant={status === s ? "default" : "outline"}
                  size="sm"
                  className="w-full justify-start"
                  disabled={updating || status === s}
                  onClick={() => handleStatusChange(s)}
                >
                  {REPORT_STATUS_LABELS[s]}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
