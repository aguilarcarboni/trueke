"use client"

import { Star } from "lucide-react"

interface UserRatingStarsProps {
  averageRating: number
  totalReviews: number
  /** Size of star icons: 'sm' | 'md' | 'lg'. Defaults to 'md'. */
  size?: "sm" | "md" | "lg"
  /** Show the numeric average and count. Defaults to true. */
  showDetails?: boolean
}

const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
}

/**
 * Renders a 5-star rating display with partial fill support.
 * Single Responsibility: visual rating rendering only.
 */
export function UserRatingStars({
  averageRating,
  totalReviews,
  size = "md",
  showDetails = true,
}: UserRatingStarsProps) {
  const iconSize = SIZES[size]

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = averageRating >= star
          const partialFill = !filled && averageRating > star - 1
          const fillPercentage = partialFill
            ? Math.round((averageRating - (star - 1)) * 100)
            : 0

          return (
            <div key={star} className="relative">
              {/* Background (empty) star */}
              <Star className={`${iconSize} text-muted-foreground/30`} />
              {/* Filled overlay */}
              {(filled || partialFill) && (
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    width: filled ? "100%" : `${fillPercentage}%`,
                  }}
                >
                  <Star
                    className={`${iconSize} fill-amber-400 text-amber-400`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      {showDetails && (
        <span className="text-sm text-muted-foreground">
          {totalReviews > 0 ? (
            <>
              {averageRating.toFixed(1)} ({totalReviews} review{totalReviews !== 1 ? "s" : ""})
            </>
          ) : (
            "No reviews yet"
          )}
        </span>
      )}
    </div>
  )
}
