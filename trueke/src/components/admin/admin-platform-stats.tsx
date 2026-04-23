"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Download, RefreshCw } from "lucide-react"
import { toPng } from "html-to-image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { getPlatformStats } from "@/app/actions/admin"
import type { PlatformStatsData } from "@/lib/entities/analytics"

const AUTO_REFRESH_MS = 60_000

function defaultStartDate() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10)
}

function exportToCSV(stats: PlatformStatsData, dateRange: { startDate: string; endDate: string }) {
  const rows: string[][] = [
    ["Category", "Metric", "Value"],
    ["Users", "Total (all time)", String(stats.users.total)],
    ["Users", "Active", String(stats.users.active)],
    ["Users", "Inactive", String(stats.users.inactive)],
    ["Users", "Banned", String(stats.users.banned)],
    ["Exchanges", "Total", String(stats.exchanges.total)],
    ["Exchanges", "Pending", String(stats.exchanges.pending)],
    ["Exchanges", "Accepted", String(stats.exchanges.accepted)],
    ["Exchanges", "Rejected", String(stats.exchanges.rejected)],
    ["Exchanges", "Cancelled", String(stats.exchanges.cancelled)],
    ["Exchanges", "Expired", String(stats.exchanges.expired)],
    ["Exchanges", "Completed", String(stats.exchanges.completed)],
    ["Exchanges", "Countered", String(stats.exchanges.countered)],
    ["Performance", "Conversion Rate", `${(stats.conversionRate * 100).toFixed(1)}%`],
    ...stats.growth.map((g) => [
      "Growth",
      g.period,
      `Users: ${g.newUsers}, Exchanges: ${g.newExchanges}`,
    ]),
  ]

  const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `platform-stats-${dateRange.startDate}-to-${dateRange.endDate}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

interface StatCardProps {
  label: string
  value: number | string
  description?: string
  variant?: "default" | "success" | "warning" | "destructive"
}

function StatCard({ label, value, description, variant = "default" }: StatCardProps) {
  const badgeVariantMap = {
    default: "secondary",
    success: "default",
    warning: "outline",
    destructive: "destructive",
  } as const
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <Badge variant={badgeVariantMap[variant]} className="text-xs">
            {description}
          </Badge>
        </CardContent>
      )}
    </Card>
  )
}

export function AdminPlatformStats() {
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [stats, setStats] = useState<PlatformStatsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const growthChartRef = useRef<HTMLDivElement>(null)

  async function downloadGrowthChartImage() {
    if (!growthChartRef.current) return
    const dataUrl = await toPng(growthChartRef.current, { cacheBust: true, pixelRatio: 2 })
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `growth-chart-${startDate}-to-${endDate}.png`
    a.click()
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getPlatformStats({ startDate, endDate })
    if (result.error) {
      setError(result.error)
    } else {
      setStats(result.data ?? null)
      setLastRefreshed(new Date())
    }
    setLoading(false)
  }, [startDate, endDate])

  // Initial load + re-load on filter change
  useEffect(() => {
    load()
  }, [load])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    intervalRef.current = setInterval(load, AUTO_REFRESH_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [load])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Date Range</CardTitle>
          <CardDescription>
            Applies to exchange counts and growth chart. User totals are always all-time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                max={defaultEndDate()}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              {lastRefreshed && (
                <span className="text-xs text-muted-foreground">
                  Last refreshed: {lastRefreshed.toLocaleTimeString()}
                </span>
              )}
              {stats && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportToCSV(stats, { startDate, endDate })}
                >
                  <Download className="size-3.5 mr-1.5" />
                  Export CSV
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-destructive text-center py-8">{error}</p>
      ) : stats ? (
        <>
          {/* User stats */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Users (all-time)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats.users.total} />
              <StatCard
                label="Active"
                value={stats.users.active}
                description={`${stats.users.total > 0 ? Math.round((stats.users.active / stats.users.total) * 100) : 0}% of total`}
                variant="success"
              />
              <StatCard
                label="Inactive"
                value={stats.users.inactive}
                variant="warning"
              />
              <StatCard
                label="Banned"
                value={stats.users.banned}
                variant="destructive"
              />
            </div>
          </div>

          {/* Exchange stats */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Exchanges ({startDate} → {endDate})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total" value={stats.exchanges.total} />
              <StatCard label="Pending" value={stats.exchanges.pending} />
              <StatCard label="Accepted" value={stats.exchanges.accepted} variant="success" />
              <StatCard label="Completed" value={stats.exchanges.completed} variant="success" />
              <StatCard label="Rejected" value={stats.exchanges.rejected} variant="destructive" />
              <StatCard label="Cancelled" value={stats.exchanges.cancelled} variant="warning" />
              <StatCard label="Expired" value={stats.exchanges.expired} variant="warning" />
              <StatCard label="Countered" value={stats.exchanges.countered} />
            </div>
          </div>

          {/* Conversion rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversion Rate</CardTitle>
              <CardDescription>
                Completed out of all closed exchanges (accepted + rejected + cancelled + expired +
                completed)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold tabular-nums">
                  {(stats.conversionRate * 100).toFixed(1)}%
                </span>
                <span className="text-sm text-muted-foreground">
                  {stats.exchanges.completed} completed /{" "}
                  {stats.exchanges.accepted +
                    stats.exchanges.rejected +
                    stats.exchanges.cancelled +
                    stats.exchanges.expired +
                    stats.exchanges.completed}{" "}
                  closed
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Growth chart */}
          {stats.growth.length > 0 && (
            <Card ref={growthChartRef}>
              <CardHeader className="flex-row items-start justify-between">
                <div>
                  <CardTitle>Growth Over Time</CardTitle>
                  <CardDescription>
                    New users and new exchanges by month within the selected date range
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={downloadGrowthChartImage}>
                  <Download className="size-3.5 mr-1" />
                  PNG
                </Button>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={stats.growth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="newUsers"
                      name="New Users"
                      fill="#6366f1"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="newExchanges"
                      name="New Exchanges"
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      ) : null}
    </div>
  )
}
