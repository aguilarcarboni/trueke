"use server"

import { createClient } from '@/utils/supabase/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/utils/auth'
import type { ReportRow, ReportStatus, ReportTargetDetails, ReportTargetType, ReporterStatus } from '@/lib/entities/report'
import { formatReportReason } from '@/lib/entities/report'
import { createNotification } from '@/utils/entities/notification'
import { handleUserStatusChange, handleBanUser } from '@/lib/server/handle-user-status-change'
import type {
  AnalyticsFilters,
  ExchangeTrafficResponse,
  GrowthPoint,
  PlatformStatsData,
  TrafficBucket,
  TransactionChartPoint,
} from '@/lib/entities/analytics'

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

// ─── Analytics helpers ────────────────────────────────────────────────────────

/**
 * Given a country code (and optionally a province name), returns the set of
 * exchange_ids whose items are located in that region. Returns null when the
 * filter produces no results so callers can short-circuit.
 */
async function getGeoFilteredExchangeIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  countryCode: string,
  province?: string,
): Promise<string[] | null> {
  // 1. Addresses matching country/province
  let addrQ: any = supabase
    .from('address')
    .select('address_id')
    .eq('country_code', countryCode.toUpperCase())
  if (province) addrQ = addrQ.ilike('province_state', `%${province}%`)
  const { data: addresses } = await addrQ
  if (!addresses?.length) return null

  // 2. Items with those addresses (current link)
  const { data: itemAddresses } = await supabase
    .from('item_address')
    .select('item_id')
    .in('address_id', addresses.map((a: any) => a.address_id))
    .eq('is_current', true)
  if (!itemAddresses?.length) return null

  // 3. Exchanges containing those items
  const itemIds = [...new Set(itemAddresses.map((ia: any) => ia.item_id))]
  const { data: exchangeItems } = await supabase
    .from('exchange_item')
    .select('exchange_id')
    .in('item_id', itemIds)
  if (!exchangeItems?.length) return null

  return [...new Set(exchangeItems.map((ei: any) => ei.exchange_id))]
}

function getBucketKey(dateStr: string, granularity: 'daily' | 'weekly' | 'monthly'): string {
  if (granularity === 'monthly') return dateStr.slice(0, 7)
  if (granularity === 'weekly') {
    const d = new Date(dateStr)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
    const monday = new Date(d)
    monday.setDate(diff)
    return monday.toISOString().slice(0, 10)
  }
  return dateStr.slice(0, 10)
}

// ─── ADMIN-1.1: Exchange Transactions Chart ───────────────────────────────────

export async function getTransactionChartData(
  filters: AnalyticsFilters,
): Promise<{ data?: TransactionChartPoint[]; error?: string }> {
  try {
    const authError = await requireAdmin()
    if (authError) return { error: authError.error }

    const supabase = await createClient()
    const startTs = filters.startDate + 'T00:00:00.000Z'
    const endTs = filters.endDate + 'T23:59:59.999Z'

    // Optional geographic filter
    let geoIds: string[] | null = null
    if (filters.countryCode) {
      geoIds = await getGeoFilteredExchangeIds(supabase, filters.countryCode, filters.province)
      if (geoIds === null) return { data: [] }
    }

    let q: any = supabase
      .from('exchange')
      .select('exchange_id, creation_date')
      .in('status', ['accepted', 'completed'])
      .gte('creation_date', startTs)
      .lte('creation_date', endTs)
    if (geoIds) q = q.in('exchange_id', geoIds)

    const { data: exchanges, error } = await q
    if (error) {
      console.error('getTransactionChartData error:', error)
      return { error: 'Failed to load transaction data.' }
    }

    // Group by day
    const grouped: Record<string, number> = {}
    for (const ex of exchanges ?? []) {
      const day = (ex.creation_date as string).slice(0, 10)
      grouped[day] = (grouped[day] ?? 0) + 1
    }

    // Fill all days in the range (so the chart has no gaps)
    const result: TransactionChartPoint[] = []
    const cursor = new Date(filters.startDate)
    const end = new Date(filters.endDate)
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10)
      result.push({ date: key, count: grouped[key] ?? 0 })
      cursor.setDate(cursor.getDate() + 1)
    }

    return { data: result }
  } catch (err) {
    console.error('getTransactionChartData error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

// ─── ADMIN-1.2: Exchange Traffic Timeline ─────────────────────────────────────

export async function getExchangeTrafficData(
  filters: AnalyticsFilters,
): Promise<{ data?: ExchangeTrafficResponse; error?: string }> {
  try {
    const authError = await requireAdmin()
    if (authError) return { error: authError.error }

    const supabase = await createClient()
    const granularity = filters.granularity ?? 'daily'

    async function fetchBuckets(startDate: string, endDate: string): Promise<{
      buckets: TrafficBucket[]
      categories: string[]
      total: number
    }> {
      const startTs = startDate + 'T00:00:00.000Z'
      const endTs = endDate + 'T23:59:59.999Z'

      let geoIds: string[] | null = null
      if (filters.countryCode) {
        geoIds = await getGeoFilteredExchangeIds(supabase, filters.countryCode, filters.province)
        if (geoIds === null) return { buckets: [], categories: [], total: 0 }
      }

      let q: any = supabase
        .from('exchange')
        .select('exchange_id, creation_date')
        .in('status', ['accepted', 'completed'])
        .gte('creation_date', startTs)
        .lte('creation_date', endTs)
      if (geoIds) q = q.in('exchange_id', geoIds)

      const { data: exchanges } = await q
      if (!exchanges?.length) return { buckets: [], categories: [], total: 0 }

      // Fetch item categories for these exchanges
      const exchangeIds = exchanges.map((e: any) => e.exchange_id)
      const { data: eiRows } = await supabase
        .from('exchange_item')
        .select('exchange_id, item_id')
        .in('exchange_id', exchangeIds)

      const itemIds = [...new Set((eiRows ?? []).map((r: any) => r.item_id))]
      const { data: items } = await supabase
        .from('item')
        .select('item_id, category')
        .in('item_id', itemIds)

      const categoryByItem = new Map<string, string>()
      for (const it of items ?? []) categoryByItem.set(it.item_id, it.category ?? 'Other')

      const categoryByExchange = new Map<string, string>()
      for (const ei of eiRows ?? []) {
        if (!categoryByExchange.has(ei.exchange_id))
          categoryByExchange.set(ei.exchange_id, categoryByItem.get(ei.item_id) ?? 'Other')
      }

      // Aggregate into time buckets
      const bucketMap: Record<string, Record<string, number>> = {}
      const allCats = new Set<string>()
      for (const ex of exchanges) {
        const key = getBucketKey(ex.creation_date, granularity)
        const cat = categoryByExchange.get(ex.exchange_id) ?? 'Other'
        if (!bucketMap[key]) bucketMap[key] = {}
        bucketMap[key][cat] = (bucketMap[key][cat] ?? 0) + 1
        bucketMap[key]['__total'] = (bucketMap[key]['__total'] ?? 0) + 1
        allCats.add(cat)
      }

      const categories = [...allCats].sort()
      const buckets: TrafficBucket[] = Object.entries(bucketMap)
        .map(([period, cats]) => {
          const bucket: TrafficBucket = { period, count: cats['__total'] ?? 0 }
          for (const cat of categories) bucket[cat] = cats[cat] ?? 0
          return bucket
        })
        .sort((a, b) => a.period.localeCompare(b.period))

      return { buckets, categories, total: exchanges.length }
    }

    const current = await fetchBuckets(filters.startDate, filters.endDate)

    let previousPeriodTotal: number | undefined
    if (filters.comparePrevious) {
      const start = new Date(filters.startDate)
      const end = new Date(filters.endDate)
      const durationMs = end.getTime() - start.getTime()
      const prevEnd = new Date(start.getTime() - 86400000)
      const prevStart = new Date(prevEnd.getTime() - durationMs)
      const prev = await fetchBuckets(
        prevStart.toISOString().slice(0, 10),
        prevEnd.toISOString().slice(0, 10),
      )
      previousPeriodTotal = prev.total
    }

    return {
      data: {
        buckets: current.buckets,
        categories: current.categories,
        currentTotal: current.total,
        previousPeriodTotal,
      },
    }
  } catch (err) {
    console.error('getExchangeTrafficData error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}

// ─── ADMIN-1.3: Platform Statistics ──────────────────────────────────────────

export async function getPlatformStats(
  filters: { startDate?: string; endDate?: string },
): Promise<{ data?: PlatformStatsData; error?: string }> {
  try {
    const authError = await requireAdmin()
    if (authError) return { error: authError.error }

    const supabase = await createClient()
    const startTs = filters.startDate ? filters.startDate + 'T00:00:00.000Z' : undefined
    const endTs = filters.endDate ? filters.endDate + 'T23:59:59.999Z' : undefined

    // Helper: count exchanges by status — always ALL-TIME, not date-filtered
    // (status reflects current state regardless of when the exchange was created)
    async function countExchanges(status: string): Promise<number> {
      const { count } = await supabase
        .from('exchange')
        .select('*', { count: 'exact', head: true })
        .eq('status', status)
      return count ?? 0
    }

    // 1. User totals (all-time by status)
    const [totalRes, activeRes, inactiveRes, bannedRes] = await Promise.all([
      supabase.from('user').select('*', { count: 'exact', head: true }),
      supabase.from('user').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('user').select('*', { count: 'exact', head: true }).eq('status', 'inactive'),
      supabase.from('user').select('*', { count: 'exact', head: true }).eq('status', 'banned'),
    ])

    // 2. Exchange counts by status (optionally date-filtered)
    const [pending, accepted, rejected, cancelled, expired, completed, countered] =
      await Promise.all([
        countExchanges('pending'),
        countExchanges('accepted'),
        countExchanges('rejected'),
        countExchanges('cancelled'),
        countExchanges('expired'),
        countExchanges('completed'),
        countExchanges('countered'),
      ])

    const exchangeTotal = pending + accepted + rejected + cancelled + expired + completed + countered
    const closedExchanges = accepted + rejected + cancelled + expired + completed
    const conversionRate = closedExchanges > 0 ? completed / closedExchanges : 0

    // 3. Growth data: monthly new users + new exchanges (within date range)
    let usersQ: any = supabase.from('user').select('created_at')
    if (startTs) usersQ = usersQ.gte('created_at', startTs)
    if (endTs) usersQ = usersQ.lte('created_at', endTs)

    let exchangesQ: any = supabase.from('exchange').select('creation_date')
    if (startTs) exchangesQ = exchangesQ.gte('creation_date', startTs)
    if (endTs) exchangesQ = exchangesQ.lte('creation_date', endTs)

    const [{ data: userRows }, { data: exchangeRows }] = await Promise.all([usersQ, exchangesQ])

    const usersByMonth: Record<string, number> = {}
    for (const u of userRows ?? []) {
      const m = (u.created_at as string).slice(0, 7)
      usersByMonth[m] = (usersByMonth[m] ?? 0) + 1
    }

    const exchangesByMonth: Record<string, number> = {}
    for (const e of exchangeRows ?? []) {
      const m = (e.creation_date as string).slice(0, 7)
      exchangesByMonth[m] = (exchangesByMonth[m] ?? 0) + 1
    }

    const allMonths = [
      ...new Set([...Object.keys(usersByMonth), ...Object.keys(exchangesByMonth)]),
    ].sort()

    const growth: GrowthPoint[] = allMonths.map((period) => ({
      period,
      newUsers: usersByMonth[period] ?? 0,
      newExchanges: exchangesByMonth[period] ?? 0,
    }))

    return {
      data: {
        users: {
          total: totalRes.count ?? 0,
          active: activeRes.count ?? 0,
          inactive: inactiveRes.count ?? 0,
          banned: bannedRes.count ?? 0,
        },
        exchanges: {
          total: exchangeTotal,
          pending,
          accepted,
          rejected,
          cancelled,
          expired,
          completed,
          countered,
        },
        conversionRate,
        growth,
      },
    }
  } catch (err) {
    console.error('getPlatformStats error:', err)
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
