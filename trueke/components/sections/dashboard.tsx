"use client"

import { ShoppingBag, ArrowLeftRight, CheckCircle, Star, TrendingUp, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { dashboardStats, notifications, items, exchanges, currentUser } from "@/lib/data"

interface DashboardProps {
  onNavigate: (section: string) => void
}

const statCards = [
  { label: "Active Listings", value: dashboardStats.activeListings, icon: ShoppingBag, color: "text-primary" },
  { label: "Pending Offers", value: dashboardStats.pendingOffers, icon: ArrowLeftRight, color: "text-accent" },
  { label: "Completed Trades", value: dashboardStats.completedTrades, icon: CheckCircle, color: "text-success" },
  { label: "Average Rating", value: dashboardStats.averageRating, icon: Star, color: "text-warning" },
]

export function Dashboard({ onNavigate }: DashboardProps) {
  const recentItems = items.slice(0, 4)
  const pendingExchanges = exchanges.filter((e) => e.status === "open").slice(0, 3)
  const unreadNotifs = notifications.filter((n) => !n.read)

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {currentUser.name.split(" ")[0]}
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
            <Button variant="ghost" size="sm" onClick={() => onNavigate("marketplace")} className="text-primary">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="h-14 w-14 rounded-lg object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.category} &middot; {item.condition}</p>
                  </div>
                  <Badge variant="secondary" className="capitalize shrink-0">
                    {item.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications & Activity */}
        <div className="space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground text-base">Notifications</CardTitle>
              {unreadNotifs.length > 0 && (
                <Badge className="bg-primary text-primary-foreground">{unreadNotifs.length} new</Badge>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {notifications.slice(0, 4).map((notif) => (
                  <div key={notif.id} className={`flex gap-3 rounded-lg p-2.5 text-sm ${!notif.read ? "bg-primary/5" : ""}`}>
                    <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!notif.read ? "bg-primary" : "bg-transparent"}`} />
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{notif.description}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pending Exchanges */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-foreground text-base">Pending Trades</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("exchanges")} className="text-primary">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingExchanges.map((ex) => (
                  <div key={ex.id} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={ex.initiator.avatar} alt={ex.initiator.name} />
                      <AvatarFallback>{ex.initiator.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{ex.initiator.name}</p>
                      <p className="text-xs text-muted-foreground">{ex.type} trade</p>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs shrink-0">{ex.status}</Badge>
                  </div>
                ))}
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
            {items.slice(4, 8).map((item) => (
              <div key={item.id} className="group cursor-pointer rounded-xl border border-border overflow-hidden transition-all hover:shadow-md">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    crossOrigin="anonymous"
                  />
                  <Badge className="absolute top-2 right-2 bg-card/90 text-card-foreground text-xs backdrop-blur-sm">
                    {item.category}
                  </Badge>
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={item.owner.avatar} alt={item.owner.name} />
                      <AvatarFallback className="text-[10px]">{item.owner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{item.owner.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
