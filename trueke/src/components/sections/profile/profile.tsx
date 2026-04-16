"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin, Calendar, Edit, Shield, Lock, Mail, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { EditProfileDialog } from "@/components/sections/profile/edit-profile-dialog"
import { getConditionLabel, getStatusLabel } from "@/lib/entities/item"
import { useSession } from "next-auth/react"
import { getProfileAction } from "@/app/actions/profile"
import { getUserRatingSummary } from "@/app/actions/review"
import { getMyItems, getUserExchanges } from "@/app/actions/exchange"
import type { UserProfile } from "@/lib/entities/profile"
import type { UserRatingSummary } from "@/lib/entities/review"
import type { Item } from "@/lib/entities/item"
import { createClient } from "@/utils/supabase/client"
import { ChangePasswordDialog } from "@/components/sections/profile/credentials/ChangePasswordDialog"
import { ChangeEmailDialog } from "@/components/sections/profile/credentials/ChangeEmailDialog"
import { UserRatingStars } from "@/components/sections/profile/user-rating-stars"
import { UserReviewsList } from "@/components/sections/profile/user-reviews-list"

const PROFILE_IMAGES_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_PROFILE_IMAGES_BUCKET || "images"

export function Profile() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [ratingSummary, setRatingSummary] = useState<UserRatingSummary | null>(null)
  const [userItems, setUserItems] = useState<Item[]>([])
  const [completedTradesCount, setCompletedTradesCount] = useState(0)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false)
  const [credentialsDialogMode, setCredentialsDialogMode] = useState<"password" | "email" | null>(null)
  const [profileRefreshKey, setProfileRefreshKey] = useState(0)

  useEffect(() => {
    if (!session?.user?.id) return

    async function fetchProfile() {
      if (!session?.user?.id) return
      const [userProfile, ratingResult, itemsResult, completedResult] = await Promise.all([
        getProfileAction(session.user.id),
        getUserRatingSummary(session.user.id),
        getMyItems(session.user.id),
        getUserExchanges(session.user.id, "completed"),
      ])
      setProfile(userProfile)
      if (ratingResult.success && ratingResult.data) {
        setRatingSummary(ratingResult.data)
      }
      if (itemsResult.success && itemsResult.data) {
        setUserItems(itemsResult.data)
      }
      if (completedResult.success && completedResult.data) {
        setCompletedTradesCount(completedResult.data.length)
      }
    }
    fetchProfile()
  }, [session?.user?.id, profileRefreshKey])

  if (!session?.user) {
    return null
  }

  const displayName = `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim() || profile?.username || "User"

  const initials = `${profile?.firstName?.charAt(0) ?? ""}${profile?.lastName?.charAt(0) ?? ""}`
  const avatarUrl = useMemo(() => {
    const raw = profile?.profile_picture_url?.trim()
    if (!raw) return undefined
    if (/^https?:\/\//i.test(raw)) return raw

    const supabase = createClient()
    const {
      data: { publicUrl },
    } = supabase.storage.from(PROFILE_IMAGES_BUCKET).getPublicUrl(raw.replace(/^\/+/, ""))

    return publicUrl || undefined
  }, [profile?.profile_picture_url])

  return (
    <>
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Profile</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card — view only */}
        <Card className="lg:row-span-2">
          <CardHeader className="flex flex-row items-center justify-end pb-0 pt-4 px-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  Deactivate account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="pt-2 text-center space-y-4">
            {/* Avatar */}
            <div className="relative inline-block">
              <Avatar className="h-24 w-24 mx-auto">
                <AvatarImage src={avatarUrl} alt={displayName} />
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
            
            {/* User rating stars */}
            <div className="flex justify-center">
              <UserRatingStars
                averageRating={ratingSummary?.average_rating ?? 0}
                totalReviews={ratingSummary?.total_reviews ?? 0}
                size="lg"
              />
            </div>
              

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{completedTradesCount}</p>
                <p className="text-xs text-muted-foreground">Completed Trades</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{userItems.length}</p>
                <p className="text-xs text-muted-foreground">Active Listings</p>
              </div>
            </div>

            {profile?.created_at && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                <Calendar className="h-3.5 w-3.5" />
                Joined on {" "}
                {new Date(profile.created_at).toLocaleDateString("en-US", {
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
              <span className="text-3xl font-bold text-foreground">
                {ratingSummary && ratingSummary.total_reviews > 0
                  ? ratingSummary.average_rating.toFixed(1)
                  : "—"}
              </span>
              {ratingSummary && ratingSummary.total_reviews > 0 && (
                <Badge className="bg-success/10 text-success border border-success/20">
                  {ratingSummary.average_rating >= 4
                    ? "Trusted Trader"
                    : ratingSummary.average_rating >= 3
                    ? "Good Trader"
                    : "New Trader"}
                </Badge>
              )}
            </div>
            {ratingSummary && ratingSummary.total_reviews > 0 && (
              <Progress value={(ratingSummary.average_rating / 5) * 100} className="h-2" />
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-lg font-bold text-foreground">
                  {ratingSummary?.average_rating?.toFixed(1) ?? "0.0"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Avg Rating</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-lg font-bold text-foreground">
                  {ratingSummary?.total_reviews ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Total Reviews</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-lg font-bold text-foreground">{completedTradesCount}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Completed Trades</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account credentials (buttons only for now) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-card-foreground">Account credentials</CardTitle>
            <p className="text-sm text-muted-foreground">
              Change your password or email address.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setCredentialsDialogMode("password")
                setCredentialsDialogOpen(true)
              }}
            >
              <Lock className="h-4 w-4" />
              Change password
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setCredentialsDialogMode("email")
                setCredentialsDialogOpen(true)
              }}
            >
              <Mail className="h-4 w-4" />
              Change email
            </Button>
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
                  <div key={item.item_id} className="flex items-center gap-4 rounded-lg border border-border p-3">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="h-14 w-14 rounded-lg object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-muted" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.category} &middot; {getConditionLabel(item.condition)}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize text-xs">{getStatusLabel(item.status)}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No items listed yet.</p>
            )}
          </CardContent>
        </Card>

        {/* User Reviews */}
        <div className="lg:col-span-3">
          {session?.user?.id && <UserReviewsList userId={session.user.id} />}
        </div>
      </div>
    </div>

    {/* Edit Profile Dialog - Prompted to the User */}
    <EditProfileDialog open={dialogOpen} onOpenChange={setDialogOpen} profile={profile} />

    <ChangePasswordDialog
      open={credentialsDialogOpen && credentialsDialogMode === "password"}
      onOpenChange={(next) => {
        if (!next) {
          setCredentialsDialogOpen(false)
          setCredentialsDialogMode(null)
        }
      }}
      onSuccess={() => setProfileRefreshKey((k) => k + 1)}
    />

    <ChangeEmailDialog
      open={credentialsDialogOpen && credentialsDialogMode === "email"}
      onOpenChange={(next) => {
        if (!next) {
          setCredentialsDialogOpen(false)
          setCredentialsDialogMode(null)
        }
      }}
      currentEmail={profile?.email ?? ""}
      onSuccess={() => setProfileRefreshKey((k) => k + 1)}
    />
    </>
  )
}
