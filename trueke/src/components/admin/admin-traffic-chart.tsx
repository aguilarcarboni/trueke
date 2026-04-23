"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Country, State } from "country-state-city"
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
import { Download, RefreshCw, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { getExchangeTrafficData } from "@/app/actions/admin"
import type { AnalyticsFilters, TrafficBucket } from "@/lib/entities/analytics"
import { toPng } from "html-to-image"

function exportTrafficCSV(
  buckets: TrafficBucket[],
  categories: string[],
  startDate: string,
  endDate: string
) {
  const header = ["Period", ...(categories.length > 0 ? categories : ["Count"])]
  const rows = buckets.map((b) => [
    b.period,
    ...(categories.length > 0
      ? categories.map((c) => String((b as Record<string, unknown>)[c] ?? 0))
      : [String((b as Record<string, unknown>).count ?? 0)]),
  ])
  const csv = [header, ...rows].map((r) => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `traffic-${startDate}-to-${endDate}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const CATEGORY_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#3b82f6",
]

function defaultStartDate() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10)
}

export function AdminTrafficChart() {
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [countryCode, setCountryCode] = useState("")
  const [province, setProvince] = useState("")
  const [granularity, setGranularity] = useState<"daily" | "weekly" | "monthly">("daily")
  const [comparePrevious, setComparePrevious] = useState(false)
  const [buckets, setBuckets] = useState<TrafficBucket[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [currentTotal, setCurrentTotal] = useState(0)
  const [previousTotal, setPreviousTotal] = useState<number | undefined>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  async function downloadChartImage() {
    if (!chartRef.current) return
    const dataUrl = await toPng(chartRef.current, { cacheBust: true, pixelRatio: 2 })
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `traffic-chart-${startDate}-to-${endDate}.png`
    a.click()
  }

  const countries = Country.getAllCountries()
  const provinces = countryCode ? State.getStatesOfCountry(countryCode) : []

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const filters: AnalyticsFilters = {
      startDate,
      endDate,
      countryCode: countryCode || undefined,
      province: province || undefined,
      granularity,
      comparePrevious,
    }
    const result = await getExchangeTrafficData(filters)
    if (result.error) {
      setError(result.error)
    } else {
      setBuckets(result.data?.buckets ?? [])
      setCategories(result.data?.categories ?? [])
      setCurrentTotal(result.data?.currentTotal ?? 0)
      setPreviousTotal(result.data?.previousPeriodTotal)
    }
    setLoading(false)
  }, [startDate, endDate, countryCode, province, granularity, comparePrevious])

  useEffect(() => {
    load()
  }, [load])

  const changePercent =
    previousTotal !== undefined && previousTotal > 0
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : null

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-1.5 min-w-0">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                min={startDate}
                max={defaultEndDate()}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label>Country</Label>
              <Select
                value={countryCode || "all"}
                onValueChange={(v) => { setCountryCode(v === "all" ? "" : v); setProvince("") }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All countries</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label>Region</Label>
              <Select
                value={province || "all"}
                onValueChange={(v) => setProvince(v === "all" ? "" : v)}
                disabled={!countryCode}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All regions</SelectItem>
                  {provinces.map((s) => (
                    <SelectItem key={s.isoCode} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 min-w-0">
              <Label>Granularity</Label>
              <Select
                value={granularity}
                onValueChange={(v) => setGranularity(v as typeof granularity)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex flex-col min-w-0">
              <Label>Compare Periods</Label>
              <Button
                variant={comparePrevious ? "default" : "outline"}
                size="sm"
                className="mt-auto w-full"
                onClick={() => setComparePrevious((v) => !v)}
              >
                {comparePrevious ? "On" : "Off"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period comparison summary — shown inside chart card when enabled */}

      {/* Chart */}
      <Card ref={chartRef}>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Exchange Traffic by Category</CardTitle>
            <CardDescription>
              {currentTotal} exchanges · {granularity} view
              {countryCode
                ? ` · ${province ? `${province}, ` : ""}${Country.getCountryByCode(countryCode)?.name ?? countryCode}`
                : ""}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {buckets.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportTrafficCSV(buckets, categories, startDate, endDate)}
                >
                  <Download className="size-3.5 mr-1" />
                  CSV
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={downloadChartImage}
                >
                  <Download className="size-3.5 mr-1" />
                  PNG
                </Button>
              </>
            )}
            <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        {comparePrevious && !loading && (
          <div className="px-6 pb-4 flex flex-wrap items-center gap-4 border-b">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Current period</span>
              <span className="text-xl font-bold tabular-nums">{currentTotal}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Previous period</span>
              <span className="text-xl font-bold tabular-nums">{previousTotal ?? "—"}</span>
            </div>
            {changePercent !== null && (
              <Badge
                variant={changePercent >= 0 ? "default" : "destructive"}
                className="flex items-center gap-1 text-sm px-3 py-1"
              >
                {changePercent >= 0 ? (
                  <TrendingUp className="size-3.5" />
                ) : (
                  <TrendingDown className="size-3.5" />
                )}
                {changePercent >= 0 ? "+" : ""}{changePercent}% vs previous period
              </Badge>
            )}
            {changePercent === null && previousTotal === 0 && (
              <span className="text-xs text-muted-foreground italic">No data in previous period</span>
            )}
          </div>
        )}
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : error ? (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          ) : buckets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <p className="text-sm">No traffic data for the selected filters.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={buckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                {categories.length > 0 ? (
                  categories.map((cat, i) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="categories"
                      fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                      radius={i === categories.length - 1 ? [4, 4, 0, 0] : undefined}
                    />
                  ))
                ) : (
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
