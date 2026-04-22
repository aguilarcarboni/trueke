"use client"

import { useEffect, useState } from "react"
import { ShoppingBag, ArrowLeftRight, CheckCircle, Star, TrendingUp, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardNotifications } from "./dashboard-notifications"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Admin } from "@/components/admin/admin"
import { getMyItems, getUserExchanges, getMarketplaceItems } from "@/app/actions/exchange"
import { getUserRatingSummary } from "@/app/actions/review"
import type { Item } from "@/lib/entities/item"
import type { ExchangeListItem } from "@/lib/entities/exchange"
import { getExchangeStatusLabel } from "@/lib/entities/exchange"

interface DashboardStats {
  activeListings: number
  pendingOffers: number
  completedTrades: number
  averageRating: number | null
}

export function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isAdmin = Boolean(session?.user?.is_admin)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentItems, setRecentItems] = useState<Item[]>([])
  const [pendingExchanges, setPendingExchanges] = useState<ExchangeListItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return

    async function fetchDashboardData() {
      const userId = session!.user.id
      setLoading(true)

      const [myItemsRes, pendingRes, completedRes, ratingRes, marketplaceRes] = await Promise.all([
        getMyItems(userId),
        getUserExchanges(userId, "pending"),
        getUserExchanges(userId, "completed"),
        getUserRatingSummary(userId),
        getMarketplaceItems(),
      ])

      setStats({
        activeListings: myItemsRes.success ? (myItemsRes.data?.length ?? 0) : 0,
        pendingOffers: pendingRes.success ? (pendingRes.data?.length ?? 0) : 0,
        completedTrades: completedRes.success ? (completedRes.data?.length ?? 0) : 0,
        averageRating: ratingRes.success && ratingRes.data ? ratingRes.data.average_rating : null,
      })

      if (pendingRes.success && pendingRes.data) {
        setPendingExchanges(pendingRes.data.slice(0, 5))
      }

      if (marketplaceRes.success && marketplaceRes.data) {
        setRecentItems(marketplaceRes.data.slice(0, 6))
      }

      setLoading(false)
    }

    fetchDashboardData()
  }, [session?.user?.id])

  if (status === "loading") {
    return null
  }

  if (isAdmin) {
    return <Admin />
  }

  const statCards = [
    { label: "Active Listings", value: stats?.activeListings ?? 0, icon: ShoppingBag, color: "text-primary" },
    { label: "Pending Offers", value: stats?.pendingOffers ?? 0, icon: ArrowLeftRight, color: "text-accent" },
    { label: "Completed Trades", value: stats?.completedTrades ?? 0, icon: CheckCircle, color: "text-success" },
    { label: "Average Rating", value: stats?.averageRating != null ? stats.averageRating.toFixed(1) : "—", icon: Star, color: "text-warning" },
  ]

  return (
    <div className="flex min-h-full w-full flex-1 flex-col space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {session?.user.first_name}
        </h1>
        <p className="text-muted-foreground mt-1">
          {"Here's what's happening with your trades today."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  {loading ? (
                    <Skeleton className="h-9 w-16 mt-1" />
                  ) : (
                    <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
                  )}
                </div>
                <div className={`rounded-xl bg-muted p-3 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recently Listed (marketplace preview) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Recently Listed</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push("/marketplace")} className="text-primary">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentItems.length > 0 ? (
              <div className="space-y-3">
                {recentItems.map((item) => (
                  <div
                    key={item.item_id}
                    className="flex items-center gap-4 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/marketplace`)}
                  >
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="h-12 w-12 rounded-lg object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                        <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.category} &middot; {item.owner_name}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize shrink-0">
                      {item.condition}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No items in the marketplace yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Notifications & Activity */}
        <div className="space-y-6">
          {/* Notifications */}
          <DashboardNotifications />

          {/* Pending Exchanges */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground text-base">Pending Trades</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/exchanges")} className="text-primary">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingExchanges.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {pendingExchanges.map((ex) => (
                    <div
                      key={ex.exchange_id}
                      className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push("/exchanges")}
                    >
                      <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          Trade with {ex.initiator_id === session?.user?.id ? ex.target_name : ex.initiator_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {ex.offered_count} offered &middot; {ex.requested_count} requested
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {getExchangeStatusLabel(ex.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No pending trades.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-foreground">Recommended for You</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
