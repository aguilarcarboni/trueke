"use server"

import { createClient } from '@/utils/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/utils/auth'
import type { ReportRow, ReportStatus, ReportTargetDetails, ReportTargetType, ReporterStatus } from '@/lib/entities/report'
import { createNotification } from '@/utils/entities/notification'
import { formatReportReason } from '@/lib/entities/report'

async function requireAdmin(): Promise<{ error: string } | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.is_admin) {
    return { error: 'Unauthorized' }
  }
  return null
}

export async function getReports(): Promise<{ data?: ReportRow[]; error?: string }> {
  try {
    const authError = await requireAdmin()
    if (authError) return { error: authError.error }

    const supabase = await createClient()

    const { data: reports, error: reportsError } = await supabase
      .from('report')
      .select('report_id,target_type,target_id,reason,description,status,created_at,reporter_user_id,admin_notes,resolved_by_user_id')
      .order('created_at', { ascending: false })

    if (reportsError) {
      console.error('getReports error:', reportsError)
      return { error: 'Failed to load reports.' }
    }

    if (!reports || reports.length === 0) {
      return { data: [] }
    }

    // Collect distinct IDs to batch-fetch
    const reporterIds = [...new Set(reports.map((r) => r.reporter_user_id))]
    const itemTargetIds = reports.filter((r) => r.target_type === 'item').map((r) => r.target_id)
    const userTargetIds = reports.filter((r) => r.target_type === 'user').map((r) => r.target_id)

    const allUserIds = [...new Set([...reporterIds, ...userTargetIds])]

    const [usersResult, itemsResult] = await Promise.all([
      allUserIds.length > 0
        ? supabase.from('user').select('user_id,username,status,created_at').in('user_id', allUserIds)
        : Promise.resolve({ data: [], error: null }),
      itemTargetIds.length > 0
        ? supabase.from('item').select('item_id,title').in('item_id', itemTargetIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    const userMap      = new Map((usersResult.data ?? []).map((u) => [u.user_id, u.username]))
    const userStatusMap = new Map((usersResult.data ?? []).map((u) => [u.user_id, u.status as ReporterStatus]))
    const userJoinMap   = new Map((usersResult.data ?? []).map((u) => [u.user_id, u.created_at as string]))
    const itemMap       = new Map((itemsResult.data ?? []).map((i) => [i.item_id, i.title]))

    // Count how many reports each reporter has filed (within the full fetched set)
    const reporterCountMap = new Map<string, number>()
    for (const r of reports) {
      reporterCountMap.set(r.reporter_user_id, (reporterCountMap.get(r.reporter_user_id) ?? 0) + 1)
    }

    const data: ReportRow[] = reports.map((r) => ({
      report_id: r.report_id,
      target_type: r.target_type,
      target_id: r.target_id,
      reason: r.reason,
      description: r.description,
      status: r.status,
      created_at: r.created_at,
      reporter_user_id: r.reporter_user_id,
      reporter_username: userMap.get(r.reporter_user_id) ?? 'Unknown',
      reporter_status: userStatusMap.get(r.reporter_user_id) ?? 'active',
      reporter_created_at: userJoinMap.get(r.reporter_user_id) ?? r.created_at,
      reporter_total_reports: reporterCountMap.get(r.reporter_user_id) ?? 1,
      target_label:
        r.target_type === 'item'
          ? (itemMap.get(r.target_id) ?? 'Unknown Item')
          : (userMap.get(r.target_id) ?? 'Unknown User'),
      admin_notes: r.admin_notes ?? null,
      resolved_by_user_id: r.resolved_by_user_id ?? null,
    }))

    return { data }
  } catch (error) {
    console.error('getReports error:', error)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function getReportTargetDetails(
  targetType: ReportTargetType,
  targetId: string,
): Promise<{ data?: ReportTargetDetails; error?: string }> {
  try {
    const authError = await requireAdmin()
    if (authError) return { error: authError.error }

    const supabase = await createClient()

    if (targetType === 'user') {
      const [userResult, reportCountResult, ratingsResult] = await Promise.all([
        supabase
          .from('user')
          .select('username')
          .eq('user_id', targetId)
          .maybeSingle(),
        supabase
          .from('report')
          .select('*', { count: 'exact', head: true })
          .eq('target_id', targetId)
          .eq('target_type', 'user'),
        supabase
          .from('user_rating')
          .select('score')
          .eq('rated_user_id', targetId),
      ])

      const username = userResult.data?.username ?? 'Unknown'
      const report_count = reportCountResult.count ?? 0
      const scores = (ratingsResult.data ?? []).map((r) => r.score as number)
      const avg_rating =
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : null

      return { data: { kind: 'user', username, report_count, avg_rating } }
    } else {
      const itemResult = await supabase
        .from('item')
        .select('title,status,owner_user_id')
        .eq('item_id', targetId)
        .maybeSingle()

      const item = itemResult.data
      if (!item) return { error: 'Item not found.' }

      const [ownerResult, reportCountResult] = await Promise.all([
        supabase
          .from('user')
          .select('username')
          .eq('user_id', item.owner_user_id)
          .maybeSingle(),
        supabase
          .from('report')
          .select('*', { count: 'exact', head: true })
          .eq('target_id', targetId)
          .eq('target_type', 'item'),
      ])

      return {
        data: {
          kind: 'item',
          title: item.title,
          status: item.status,
          owner_username: ownerResult.data?.username ?? 'Unknown',
          report_count: reportCountResult.count ?? 0,
        },
      }
    }
  } catch (error) {
    console.error('getReportTargetDetails error:', error)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  adminNotes?: string,
): Promise<{ error?: string }> {
  try {
    const authError = await requireAdmin()
    if (authError) return { error: authError.error }

    const session = await getServerSession(authOptions)
    const supabase = await createClient()

    const updatePayload: Record<string, unknown> = { status }
    if (status === 'resolved') {
      updatePayload.admin_notes = adminNotes?.trim() || null
      updatePayload.resolved_by_user_id = session!.user.id
    }

    const { error } = await supabase
      .from('report')
      .update(updatePayload)
      .eq('report_id', reportId)

    if (error) {
      console.error('updateReportStatus error:', error)
      return { error: 'Failed to update report status.' }
    }

    if (status === 'resolved') {
      // Non-blocking: notify the reporter that their report was resolved
      supabase
        .from('report')
        .select('reporter_user_id,reason')
        .eq('report_id', reportId)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) return
          createNotification({
            recipient_user_id: data.reporter_user_id,
            sender_user_id: session!.user.id,
            type: 'system',
            title: 'Report Resolved',
            body: `Your report for "${formatReportReason(data.reason)}" has been reviewed and resolved.`,
            priority: 'normal',
          })
        })
    }

    return {}
  } catch (error) {
    console.error('updateReportStatus error:', error)
    return { error: 'An unexpected error occurred.' }
  }
}
