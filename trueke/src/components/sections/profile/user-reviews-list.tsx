"use client"

import { useEffect, useState } from "react"
import { Star, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { getUserReviews } from "@/app/actions/review"
import type { Review } from "@/lib/entities/review"

interface UserReviewsListProps {
  userId: string
}

/**
 * Displays the list of reviews received by a user.
 * Lazy-loaded: fetches data on mount.
 * Single Responsibility: rendering review list only.
 */
export function UserReviewsList({ userId }: UserReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      const result = await getUserReviews(userId)
      if (!cancelled && result.success && result.data) {
        setReviews(result.data)
      }
      if (!cancelled) setLoading(false)
    }
    load()

    return () => {
      cancelled = true
    }
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-card-foreground">Reviews</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <MessageSquare className="h-5 w-5 text-primary" />
          Reviews ({reviews.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewItem key={review.review_id} review={review} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-6">
            No reviews received yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Single Review Item ──────────────────────────────────────────────────────

function ReviewItem({ review }: { review: Review }) {
  const initial = review.reviewer_name?.charAt(0)?.toUpperCase() ?? "?"

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarImage src={review.reviewer_avatar || undefined} alt={review.reviewer_name ?? "Reviewer"} />
        <AvatarFallback className="text-xs">{initial}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {review.reviewer_name ?? "Anonymous"}
          </span>
          {/* Star display */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-3.5 w-3.5 ${
                  star <= review.rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(review.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {review.comment && (
          <p className="text-sm text-muted-foreground leading-relaxed break-words">
            {review.comment}
          </p>
        )}
      </div>
    </div>
  )
}
