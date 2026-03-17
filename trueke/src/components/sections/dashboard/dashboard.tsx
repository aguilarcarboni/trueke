"use client"

import { ShoppingBag, ArrowLeftRight, CheckCircle, Star, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Admin } from "@/components/admin/admin"

const dashboardStats = {
  activeListings: 4,
  pendingOffers: 3,
  completedTrades: 47,
  averageRating: 4.8,
}


const statCards = [
  { label: "Active Listings", value: dashboardStats.activeListings, icon: ShoppingBag, color: "text-primary" },
  { label: "Pending Offers", value: dashboardStats.pendingOffers, icon: ArrowLeftRight, color: "text-accent" },
  { label: "Completed Trades", value: dashboardStats.completedTrades, icon: CheckCircle, color: "text-success" },
  { label: "Average Rating", value: dashboardStats.averageRating, icon: Star, color: "text-warning" },
]

export function Dashboard() {
  const { data: session, status } = useSession()

  const router = useRouter()
  const isAdmin = Boolean(session?.user?.is_admin)

  if (status === "loading") {
    return null
  }

  if (isAdmin) {
    return <Admin />
  }

  const recentItems = []
  const pendingExchanges = []

  return (
    <div className="space-y-8">
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
                  <p className="text-3xl font-bold text-foreground mt-1">{stat.value}</p>
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
        {/* Recent Items */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Recently Listed</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push("/marketplace")} className="text-primary">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Activity */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground text-base">Notifications</CardTitle>
              <Badge className="bg-primary text-primary-foreground">0 new</Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
              </div>
            </CardContent>
          </Card>

          {/* Pending Exchanges */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground text-base">Pending Trades</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/exchanges")} className="text-primary">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
              </div>
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
