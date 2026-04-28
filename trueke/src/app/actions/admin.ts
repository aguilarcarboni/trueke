"use server"

import { createClient } from '@/utils/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/utils/auth'
import type { ReportRow, ReportStatus, ReportTargetDetails, ReportTargetType } from '@/lib/entities/report'
import { handleUserStatusChange, handleBanUser } from '@/lib/server/handle-user-status-change'

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
      .select('report_id,target_type,target_id,reason,description,status,created_at,reporter_user_id')
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
        ? supabase.from('user').select('user_id,username').in('user_id', allUserIds)
        : Promise.resolve({ data: [], error: null }),
      itemTargetIds.length > 0
        ? supabase.from('item').select('item_id,title').in('item_id', itemTargetIds)
        : Promise.resolve({ data: [], error: null }),
    ])

    const userMap = new Map((usersResult.data ?? []).map((u) => [u.user_id, u.username]))
    const itemMap = new Map((itemsResult.data ?? []).map((i) => [i.item_id, i.title]))

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
      target_label:
        r.target_type === 'item'
          ? (itemMap.get(r.target_id) ?? 'Unknown Item')
          : (userMap.get(r.target_id) ?? 'Unknown User'),
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
): Promise<{ error?: string }> {
  try {
    const authError = await requireAdmin()
    if (authError) return { error: authError.error }

    const supabase = await createClient()

    const { error } = await supabase
      .from('report')
      .update({ status })
      .eq('report_id', reportId)

    if (error) {
      console.error('updateReportStatus error:', error)
      return { error: 'Failed to update report status.' }
    }

    return {}
  } catch (error) {
    console.error('updateReportStatus error:', error)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function getAdminUsers(): Promise<{ data?: { user_id: string; username: string; status: string }[]; error?: string }> {
  try {
    const authError = await requireAdmin()
    if (authError) return { error: authError.error }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user')
      .select('user_id,username,status')
      .order('username', { ascending: true })

    if (error) return { error: 'Failed to load users.' }

    return { data: data ?? [] }
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export interface AdminUserDetails {
  user_id: string
  username: string
  first_name: string
  last_name: string
  email: string
  status: string
  is_admin: boolean
  created_at: string
  bio: string | null
  profile_picture_url: string | null
  end_ban_date_time: string | null
  completed_trades: number
  active_items: number
  avg_rating: number | null
  total_ratings: number
  reports_received: number
  reports_filed: number
}

export async function getAdminUserDetails(
  userId: string,
): Promise<{ data?: AdminUserDetails; error?: string }> {
  try {
    const authError = await requireAdmin()
    if (authError) return { error: authError.error }

    const supabase = await createClient()

    const [
      userResult,
      tradesResult,
      activeItemsResult,
      ratingsResult,
      reportsReceivedResult,
      reportsFiledResult,
    ] = await Promise.all([
      supabase
        .from('user')
        .select('user_id,username,first_name,last_name,email,status,is_admin,created_at,bio,profile_picture_url,end_ban_date_time')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('exchange_participant')
        .select('exchange_id, exchange!inner(status)', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('exchange.status', 'completed'),
      supabase
        .from('item')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', userId)
        .eq('status', 'active'),
      supabase
        .from('user_rating')
        .select('score')
        .eq('rated_user_id', userId),
      supabase
        .from('report')
        .select('*', { count: 'exact', head: true })
        .eq('target_id', userId)
        .eq('target_type', 'user'),
      supabase
        .from('report')
        .select('*', { count: 'exact', head: true })
        .eq('reporter_user_id', userId),
    ])

    if (!userResult.data) return { error: 'User not found.' }

    const u = userResult.data
    const scores = (ratingsResult.data ?? []).map((r) => r.score as number)
    const avg_rating =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : null

    return {
      data: {
        user_id: u.user_id,
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        status: u.status,
        is_admin: u.is_admin,
        created_at: u.created_at,
        bio: u.bio ?? null,
        profile_picture_url: u.profile_picture_url ?? null,
        end_ban_date_time: u.end_ban_date_time ?? null,
        completed_trades: tradesResult.count ?? 0,
        active_items: activeItemsResult.count ?? 0,
        avg_rating,
        total_ratings: scores.length,
        reports_received: reportsReceivedResult.count ?? 0,
        reports_filed: reportsFiledResult.count ?? 0,
      },
    }
  } catch (error) {
    console.error('getAdminUserDetails error:', error)
    return { error: 'An unexpected error occurred.' }
  }
}

export async function banUser(
  userId: string,
  bannedUntil: Date | null,
  reason: string,
): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.is_admin) return { error: 'Unauthorized' }

    const endBanDateTime = bannedUntil ?? new Date('9999-12-31T23:59:59Z')
    const result = await handleBanUser(userId, endBanDateTime, reason || undefined)
    if (result?.error) return result

    const supabase = await createClient()
    await supabase.from('admin_audit_log').insert({
      admin_user_id:  session.user.id,
      target_user_id: userId,
      action_type:    'ban',
      details:        reason || null,
    })

    return {}
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}

export async function unbanUser(userId: string): Promise<{ error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.is_admin) return { error: 'Unauthorized' }

    const supabase = await createClient()

    const { error: updateError } = await supabase
      .from('user')
      .update({ status: 'active', end_ban_date_time: null })
      .eq('user_id', userId)

    if (updateError) return { error: updateError.message }

    await supabase.from('admin_audit_log').insert({
      admin_user_id:  session.user.id,
      target_user_id: userId,
      action_type:    'unban',
      details:        null,
    })

    return {}
  } catch {
    return { error: 'An unexpected error occurred.' }
  }
}
