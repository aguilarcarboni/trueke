"use client"

import { useState } from "react"
import { Star, Loader2, MessageSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { submitReview } from "@/app/actions/review"
import { getFriendlyErrorMessage } from "@/lib/error-messages"
import type { ExchangeItem } from "@/lib/entities/exchange"
import type { ItemConditionRating } from "@/lib/entities/review"
import {
  ITEM_CONDITION_RATINGS,
  ITEM_CONDITION_RATING_LABELS,
  ITEM_CONDITION_RATING_STYLES,
  REVIEW_COMMENT_MAX_LENGTH,
} from "@/lib/entities/review"

interface ReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exchangeId: string
  currentUserId: string
  otherUserId: string
  otherUserName: string
  /** Items the current user RECEIVED (i.e. the items they can review condition for). */
  receivedItems: ExchangeItem[]
  onSuccess?: () => void
}

interface ItemConditionState {
  condition_rating: ItemConditionRating | null
  comment: string
}

/**
 * Full-screen review dialog shown after exchange completion.
 * Collects: user rating (1–5 stars), optional user comment,
 * and condition reviews for each received item.
 *
 * Single Responsibility: review data collection and submission.
 */
export function ReviewDialog({
  open,
  onOpenChange,
  exchangeId,
  currentUserId,
  otherUserId,
  otherUserName,
  receivedItems,
  onSuccess,
}: ReviewDialogProps) {
  const { toast } = useToast()
  const [userRating, setUserRating] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [userComment, setUserComment] = useState("")
  const [itemReviews, setItemReviews] = useState<Record<string, ItemConditionState>>(
    () => {
      const initial: Record<string, ItemConditionState> = {}
      for (const item of receivedItems) {
        initial[item.item_id] = { condition_rating: null, comment: "" }
      }
      return initial
    }
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateItemReview = (itemId: string, patch: Partial<ItemConditionState>) => {
    setItemReviews((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], ...patch },
    }))
  }

  const canSubmit =
    userRating >= 1 &&
    userRating <= 5 &&
    receivedItems.every((item) => itemReviews[item.item_id]?.condition_rating !== null)

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)

    try {
      const result = await submitReview({
        exchange_id: exchangeId,
        reviewer_user_id: currentUserId,
        reviewed_user_id: otherUserId,
        user_rating: userRating,
        user_comment: userComment.trim() || undefined,
        item_reviews: receivedItems.map((item) => ({
          item_id: item.item_id,
          condition_rating: itemReviews[item.item_id].condition_rating!,
          comment: itemReviews[item.item_id].comment.trim() || undefined,
        })),
      })

      if (result.success) {
        toast({
          title: "Review submitted!",
          description: "Thank you for your feedback.",
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: "Couldn't submit review",
          description: getFriendlyErrorMessage(result.error),
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Connection error",
        description: "We couldn't reach the server. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setUserRating(0)
    setHoveredStar(0)
    setUserComment("")
    const initial: Record<string, ItemConditionState> = {}
    for (const item of receivedItems) {
      initial[item.item_id] = { condition_rating: null, comment: "" }
    }
    setItemReviews(initial)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) resetForm()
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Trade</DialogTitle>
          <DialogDescription>
            Rate your experience trading with <span className="font-semibold">{otherUserName}</span> and review the items you received.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* ─── User Rating ─────────────────────────────────── */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              Rate {otherUserName} <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setUserRating(star)}
                  aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
                >
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= (hoveredStar || userRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
              {userRating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {userRating}/5
                </span>
              )}
            </div>

            {/* Optional user comment */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" />
                Comment (optional)
              </Label>
              <Textarea
                placeholder={`How was your experience with ${otherUserName}?`}
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                maxLength={REVIEW_COMMENT_MAX_LENGTH}
                rows={2}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {userComment.length}/{REVIEW_COMMENT_MAX_LENGTH}
              </p>
            </div>
          </div>

          {/* ─── Item Condition Reviews ──────────────────────── */}
          {receivedItems.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-sm font-medium">
                  Rate Items Received <span className="text-destructive">*</span>
                </Label>
                {receivedItems.map((item) => (
                  <ItemConditionReview
                    key={item.item_id}
                    item={item}
                    state={itemReviews[item.item_id]}
                    onUpdate={(patch) => updateItemReview(item.item_id, patch)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Item Condition Review Sub-component ─────────────────────────────────────

interface ItemConditionReviewProps {
  item: ExchangeItem
  state: ItemConditionState
  onUpdate: (patch: Partial<ItemConditionState>) => void
}

/**
 * Review widget for a single received item.
 * Shows item thumbnail, title, and condition rating pills.
 */
function ItemConditionReview({ item, state, onUpdate }: ItemConditionReviewProps) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-2.5">
      {/* Item header */}
      <div className="flex items-center gap-3">
        {item.images?.[0] ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="h-10 w-10 rounded object-cover shrink-0"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
            <span className="text-xs text-muted-foreground">N/A</span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{item.title}</p>
          <p className="text-xs text-muted-foreground capitalize">
            Listed as: {item.condition}
          </p>
        </div>
      </div>

      {/* Condition rating pills */}
      <div className="flex flex-wrap gap-1.5">
        {ITEM_CONDITION_RATINGS.map((rating) => {
          const isSelected = state.condition_rating === rating
          return (
            <button
              key={rating}
              type="button"
              onClick={() => onUpdate({ condition_rating: rating })}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
            >
              <Badge
                variant="outline"
                className={`text-xs cursor-pointer transition-all ${
                  isSelected
                    ? ITEM_CONDITION_RATING_STYLES[rating]
                    : "hover:bg-accent"
                }`}
              >
                {ITEM_CONDITION_RATING_LABELS[rating]}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Optional item comment */}
      <Textarea
        placeholder="Any notes about this item's condition? (optional)"
        value={state.comment}
        onChange={(e) => onUpdate({ comment: e.target.value })}
        maxLength={REVIEW_COMMENT_MAX_LENGTH}
        rows={1}
        className="resize-none text-sm"
      />
    </div>
  )
}
