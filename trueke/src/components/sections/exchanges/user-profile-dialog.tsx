"use client"

import { useEffect, useState } from "react"
import { MapPin, Calendar } from "lucide-react"
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
import { getUserRatingSummary, getUserReviews } from "@/app/actions/review"
import { UserRatingStars } from "@/components/sections/profile/user-rating-stars"
import type { PublicUserProfile } from "@/lib/entities/profile"
import type { UserRatingSummary } from "@/lib/entities/review"
import type { Review } from "@/lib/entities/review"
import { Star } from "lucide-react"

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
  const [ratingSummary, setRatingSummary] = useState<UserRatingSummary | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(false)
  const [isDeactivated, setIsDeactivated] = useState(false)

  useEffect(() => {
    if (!open || !userId) return
    let cancelled = false

    async function load() {
      setLoading(true)
      const [profileData, ratingResult, reviewsResult] = await Promise.all([
        getPublicProfileAction(userId!),
        getUserRatingSummary(userId!),
        getUserReviews(userId!, 5),
      ])
      if (!cancelled) {
        if (profileData && 'deactivated' in profileData) {
          setIsDeactivated(true)
        } else {
          setProfile(profileData)
        }
        if (ratingResult.success && ratingResult.data) {
          setRatingSummary(ratingResult.data)
        }
        if (reviewsResult.success && reviewsResult.data) {
          setReviews(reviewsResult.data)
        }
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
    if (!open) {
      setProfile(null)
      setRatingSummary(null)
      setReviews([])
      setIsDeactivated(false)
    }
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
        ) : isDeactivated ? (
          <div className="py-8 flex flex-col items-center gap-2 text-center">
            <p className="text-sm font-medium text-muted-foreground">This account has been deactivated.</p>
            <p className="text-xs text-muted-foreground/60">This user is no longer active on the platform.</p>
          </div>
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

            {/* User rating */}
            <UserRatingStars
              averageRating={ratingSummary?.average_rating ?? 0}
              totalReviews={ratingSummary?.total_reviews ?? 0}
              size="md"
            />

            <Separator />

            {/* Recent reviews */}
            {reviews.length > 0 && (
              <div className="w-full space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Reviews</p>
                {reviews.map((review) => (
                  <div key={review.review_id} className="flex items-start gap-2 text-left">
                    <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-3 w-3 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      {review.comment && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{review.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        by {review.reviewer_name ?? "Anonymous"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {reviews.length > 0 && <Separator />}

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
