export type Granularity = 'daily' | 'weekly' | 'monthly'

export interface AnalyticsFilters {
  startDate: string        // 'YYYY-MM-DD'
  endDate: string          // 'YYYY-MM-DD'
  countryCode?: string     // ISO 2-letter code, e.g. 'CR'
  province?: string        // province_state name
  granularity?: Granularity
  comparePrevious?: boolean
}

// ─── ADMIN-1.1 ───────────────────────────────────────────────────────────────

export interface TransactionChartPoint {
  date: string   // 'YYYY-MM-DD' daily bucket
  count: number
}

// ─── ADMIN-1.2 ───────────────────────────────────────────────────────────────

export interface TrafficBucket {
  period: string                      // 'YYYY-MM-DD' | 'YYYY-Www' | 'YYYY-MM'
  count: number                       // total for the period
  [category: string]: string | number // per-category breakdown
}

export interface ExchangeTrafficResponse {
  buckets: TrafficBucket[]
  categories: string[]
  currentTotal: number
  previousPeriodTotal?: number
}

// ─── ADMIN-1.3 ───────────────────────────────────────────────────────────────

export interface UserStatsData {
  total: number
  active: number
  inactive: number
  banned: number
}

export interface ExchangeStatsData {
  total: number
  pending: number
  accepted: number
  rejected: number
  cancelled: number
  expired: number
  completed: number
  countered: number
}

export interface GrowthPoint {
  period: string     // 'YYYY-MM'
  newUsers: number
  newExchanges: number
}

export interface PlatformStatsData {
  users: UserStatsData
  exchanges: ExchangeStatsData
  /** accepted / (accepted + rejected + cancelled + expired + completed) */
  conversionRate: number
  growth: GrowthPoint[]
}
