export type ReportTargetType = 'item' | 'user'
export type ReportStatus = 'open' | 'reviewed' | 'resolved'
export type ReporterStatus = 'active' | 'inactive' | 'banned'

export interface ReportRow {
  report_id: string
  target_type: ReportTargetType
  target_id: string
  reason: string
  description: string | null
  status: ReportStatus
  created_at: string
  reporter_username: string
  reporter_user_id: string
  reporter_status: ReporterStatus
  reporter_created_at: string
  reporter_total_reports: number
  target_label: string
}

export interface ReportTargetUserDetails {
  kind: 'user'
  username: string
  report_count: number
  avg_rating: number | null
}

export interface ReportTargetItemDetails {
  kind: 'item'
  title: string
  status: string
  owner_username: string
  report_count: number
}

export type ReportTargetDetails = ReportTargetUserDetails | ReportTargetItemDetails

export const REPORTER_STATUS_STYLES: Record<ReporterStatus, string> = {
  active: 'bg-success/15 text-success border-success/20',
  inactive: 'bg-muted/60 text-muted-foreground border-border',
  banned: 'bg-destructive/10 text-destructive border-destructive/20',
}

export const REPORTER_STATUS_LABELS: Record<ReporterStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  banned: 'Banned',
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: 'Open',
  reviewed: 'Reviewed',
  resolved: 'Resolved',
}

export const REPORT_STATUS_STYLES: Record<ReportStatus, string> = {
  open: 'bg-destructive/10 text-destructive border-destructive/20',
  reviewed: 'bg-warning/20 text-warning-foreground border-warning/25',
  resolved: 'bg-success/15 text-success border-success/20',
}

export const REPORT_TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  item: 'Item',
  user: 'User',
}

export function formatReportReason(reason: string): string {
  return reason
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
