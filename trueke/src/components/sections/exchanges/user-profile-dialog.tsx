"use client"

import { useEffect, useState } from "react"
import { MapPin, Calendar, Star } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { getPublicProfileAction } from "@/app/actions/profile"
import type { PublicUserProfile } from "@/lib/entities/profile"

interface UserProfileDialogProps {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Displays a read-only public profile card inside a dialog.
 *
 * - Fetches data lazily when opened (single responsibility: display only).
 * - Uses getPublicProfileAction (server action) for data access.
 * - Shows only privacy-safe fields (no email, no admin flag).
 */
export function UserProfileDialog({ userId, open, onOpenChange }: UserProfileDialogProps) {
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !userId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const data = await getPublicProfileAction(userId!)
      if (!cancelled) {
        setProfile(data)
        setLoading(false)
      }
    }
    load()

    return () => {
      cancelled = true
    }
  }, [open, userId])

  // Reset when closed so stale data doesn't flash on reopen
  useEffect(() => {
    if (!open) setProfile(null)
  }, [open])

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim() || profile.username
    : ""

  const initials = profile
    ? `${profile.firstName?.charAt(0) ?? ""}${profile.lastName?.charAt(0) ?? ""}`
    : ""

  const location = profile
    ? [profile.city, profile.province].filter(Boolean).join(", ")
    : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
        </DialogHeader>

        {loading ? (
          <ProfileSkeleton />
        ) : profile ? (
          <div className="flex flex-col items-center text-center space-y-4 py-2">
            {/* Avatar */}
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.profile_picture_url || undefined} alt={displayName} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>

            {/* Name & username */}
            <div>
              <h3 className="text-lg font-semibold text-foreground">{displayName}</h3>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            </div>

            {/* Location */}
            {location && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-sm">{location}</span>
              </div>
            )}

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs break-words">
                {profile.bio}
              </p>
            )}

            {/* Star rating placeholder */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="h-4 w-4 text-muted" />
              ))}
            </div>

            <Separator />

            {/* Joined date */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Joined{" "}
              {new Date(profile.created_at).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            User not found.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Loading skeleton matching the profile card layout. */
function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center space-y-4 py-2">
      <Skeleton className="h-20 w-20 rounded-full" />
      <Skeleton className="h-5 w-36" />
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>
  )
}
