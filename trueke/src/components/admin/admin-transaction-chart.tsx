"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Country, State } from "country-state-city"
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { BarChart2, Download, RefreshCw, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { toPng } from "html-to-image"
import { getTransactionChartData } from "@/app/actions/admin"
import type { AnalyticsFilters, TransactionChartPoint } from "@/lib/entities/analytics"

function exportTransactionCSV(data: TransactionChartPoint[], startDate: string, endDate: string) {
  const rows = [["Date", "Completed Exchanges"], ...data.map((d) => [d.date, String(d.count)])]
  const csv = rows.map((r) => r.join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `transactions-${startDate}-to-${endDate}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function defaultStartDate() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

function defaultEndDate() {
  return new Date().toISOString().slice(0, 10)
}

export function AdminTransactionChart() {
  const [startDate, setStartDate] = useState(defaultStartDate)
  const [endDate, setEndDate] = useState(defaultEndDate)
  const [countryCode, setCountryCode] = useState("")
  const [province, setProvince] = useState("")
  const [chartType, setChartType] = useState<"bar" | "line">("bar")
  const [data, setData] = useState<TransactionChartPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  async function downloadChartImage() {
    if (!chartRef.current) return
    const dataUrl = await toPng(chartRef.current, { cacheBust: true, pixelRatio: 2 })
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `transactions-chart-${startDate}-to-${endDate}.png`
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
    }
    const result = await getTransactionChartData(filters)
    if (result.error) {
      setError(result.error)
    } else {
      setData(result.data ?? [])
    }
    setLoading(false)
  }, [startDate, endDate, countryCode, province])

  useEffect(() => {
    load()
  }, [load])

  const hasData = data.some((d) => d.count > 0)

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div className="space-y-1.5 min-w-0">
              <Label>Country</Label>
              <Select
                value={countryCode || "all"}
                onValueChange={(v) => { setCountryCode(v === "all" ? "" : v); setProvince("") }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All countries" />
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
              <Label>Province / Region</Label>
              <Select
                value={province || "all"}
                onValueChange={(v) => setProvince(v === "all" ? "" : v)}
                disabled={!countryCode}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All regions" />
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
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card ref={chartRef}>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>Completed Exchanges Over Time</CardTitle>
            <CardDescription>
              {countryCode
                ? `${province ? `${province}, ` : ""}${Country.getCountryByCode(countryCode)?.name ?? countryCode}`
                : "All regions"}
              {" · "}
              {startDate} → {endDate}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant={chartType === "bar" ? "default" : "outline"}
              onClick={() => setChartType("bar")}
            >
              <BarChart2 className="size-3.5 mr-1" />
              Bar
            </Button>
            <Button
              size="sm"
              variant={chartType === "line" ? "default" : "outline"}
              onClick={() => setChartType("line")}
            >
              <TrendingUp className="size-3.5 mr-1" />
              Line
            </Button>
            {hasData && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportTransactionCSV(data, startDate, endDate)}
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
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full rounded-lg" />
          ) : error ? (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          ) : !hasData ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
              <BarChart2 className="size-10 opacity-30" />
              <p className="text-sm">No completed exchanges found for the selected filters.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(value: number) => [value, "Exchanges"]}
                  labelFormatter={(label: string) => `Date: ${label}`}
                />
                {chartType === "bar" ? (
                  <Bar
                    dataKey="count"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                  />
                ) : (
                  <Line
                    type="monotone"
                    dataKey="count"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    stroke="var(--primary)"
                    isAnimationActive={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
