"use client"

import { Star, MapPin, Calendar, Edit, Shield, Settings, Camera } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { currentUser, items, exchanges } from "@/lib/data"

export function Profile() {
  const userItems = items.filter((i) => i.owner.id === currentUser.id)
  const completedExchanges = exchanges.filter((e) => e.status === "accepted")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <Button variant="outline" className="gap-2">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:row-span-2">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="relative inline-block">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback className="text-2xl">{currentUser.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <button className="absolute bottom-0 right-0 rounded-full bg-primary p-1.5 text-primary-foreground hover:bg-primary/90">
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-card-foreground">{currentUser.name}</h2>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm">{currentUser.location}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-5 w-5 ${s <= Math.round(currentUser.rating) ? "text-warning fill-warning" : "text-muted"}`}
                />
              ))}
              <span className="text-sm font-semibold text-foreground ml-1">{currentUser.rating}</span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{currentUser.bio}</p>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{currentUser.totalTrades}</p>
                <p className="text-xs text-muted-foreground">Total Trades</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{userItems.length}</p>
                <p className="text-xs text-muted-foreground">Active Listings</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <Calendar className="h-3.5 w-3.5" />
              Joined {new Date(currentUser.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>

            <Button className="w-full gap-2">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        {/* Trust Score */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-card-foreground">
              <Shield className="h-5 w-5 text-primary" />
              Trust Score
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-foreground">92</span>
              <Badge className="bg-success/10 text-success border border-success/20">Trusted Trader</Badge>
            </div>
            <Progress value={92} className="h-2" />

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "Completed Trades", value: "47", max: "50" },
                { label: "Response Rate", value: "96%", max: "100%" },
                { label: "On-time Meetings", value: "98%", max: "100%" },
                { label: "Positive Reviews", value: "45", max: "47" },
              ].map((metric) => (
                <div key={metric.label} className="rounded-lg bg-muted p-3">
                  <p className="text-lg font-bold text-foreground">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{metric.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* My Listings */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-card-foreground">My Listings</CardTitle>
            <Button variant="outline" size="sm">Add Item</Button>
          </CardHeader>
          <CardContent>
            {userItems.length > 0 ? (
              <div className="space-y-3">
                {userItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                    <img src={item.images[0]} alt={item.title} className="h-14 w-14 rounded-lg object-cover" crossOrigin="anonymous" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.category} &middot; {item.condition}</p>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">{item.state}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No items listed yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Trades */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-card-foreground">Trade History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exchanges.slice(0, 3).map((ex) => (
                <div key={ex.id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={ex.initiator.avatar} alt={ex.initiator.name} />
                    <AvatarFallback>{ex.initiator.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{ex.initiator.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ex.type} trade &middot; {new Date(ex.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs">{ex.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
