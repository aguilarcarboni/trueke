"use client"

import { useState } from "react"
import { Star, MapPin, Calendar, Edit, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { items, exchanges } from "@/lib/data"
import { EditProfileDialog } from "@/components/edit-profile-dialog"
import type { UserProfile } from "@/utils/supabase/tables/profile"

interface ProfileProps {
  profile: UserProfile | null
}

export function Profile({ profile }: ProfileProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim() || profile.username
    : "—"

  const userItems = items.filter((i) => i.owner.id === (profile?.id ?? ""))
  const completedExchanges = exchanges.filter((e) => e.status === "accepted")

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()



  return (
    <>
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card — view only */}
        <Card className="lg:row-span-2">
          <CardContent className="pt-6 text-center space-y-4">
            {/* Avatar */}
            <div className="relative inline-block">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={profile?.profilePictureUrl || undefined} alt={displayName} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
            </div>

            {/* Name, username, location */}
            <div>
              <h2 className="text-xl font-bold text-card-foreground">{displayName}</h2>
              {profile?.username && (
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              )}
              {(profile?.address?.muniDistrict || profile?.address?.city || profile?.address?.province || profile?.address?.countryCode) && (
                <div className="flex items-center justify-center gap-1.5 mt-1 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span className="text-sm">
                    {[profile.address.muniDistrict, profile.address.city, profile.address.province, profile.address.countryCode]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
              {profile?.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed wrap-break-word">{profile.bio}</p>
              )}
            </div>
            

            {/* Static 5-star rating for now */} 
            <div className="flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-5 w-5 text-muted" />
              ))}
            </div>
              

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{completedExchanges.length}</p>
                <p className="text-xs text-muted-foreground">Total Trades</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{userItems.length}</p>
                <p className="text-xs text-muted-foreground">Active Listings</p>
              </div>
            </div>

            {profile?.createdAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <Calendar className="h-3.5 w-3.5" />
                Joined on {" "}
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}

            <Button className="w-full gap-2" onClick={() => setDialogOpen(true)}>
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
                { label: "Completed Trades", value: "47" },
                { label: "Response Rate", value: "96%" },
                { label: "Meeting Participation Rate", value: "98%" },
                { label: "Positive Reviews", value: "45" },
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
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="h-14 w-14 rounded-lg object-cover"
                      crossOrigin="anonymous"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.category} &middot; {item.condition}
                      </p>
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
                      {ex.type} trade &middot;{" "}
                      {new Date(ex.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
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

    {/* Edit Profile Dialog - Prompted to the User */}
    <EditProfileDialog open={dialogOpen} onOpenChange={setDialogOpen} profile={profile} />
    </>
  )
}
