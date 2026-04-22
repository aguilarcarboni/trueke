// ─── Rating & Review Domain Types ────────────────────────────────────────────

/** Condition rating a reviewer can assign to a received item. */
export type ItemConditionRating = 'like_new' | 'good' | 'acceptable' | 'bad'

// ─── Domain Models ───────────────────────────────────────────────────────────

/** A user-to-user rating on a completed exchange. */
export interface Review {
  review_id: string
  exchange_id: string
  reviewer_user_id: string
  reviewed_user_id: string
  rating: number // 1–5
  comment: string | null
  created_at: string
  /** Resolved at read-time (not stored). */
  reviewer_name?: string
  reviewer_avatar?: string
}

/** A condition review for a specific item received in a completed exchange. */
export interface ItemReview {
  item_review_id: string
  exchange_id: string
  reviewer_user_id: string
  item_id: string
  condition_rating: ItemConditionRating
  comment: string | null
  created_at: string
}

/** Aggregated rating stats for a single user (from the DB view). */
export interface UserRatingSummary {
  user_id: string
  average_rating: number
  total_reviews: number
}

// ─── Request DTOs ────────────────────────────────────────────────────────────

/** Submit a user-to-user review after a completed exchange. */
export interface CreateReviewRequest {
  exchange_id: string
  reviewer_user_id: string
  reviewed_user_id: string
  rating: number // 1–5
  comment?: string
}

/** Submit item condition reviews for items received in a completed exchange. */
export interface CreateItemReviewRequest {
  exchange_id: string
  reviewer_user_id: string
  item_id: string
  condition_rating: ItemConditionRating
  comment?: string
}

/** Combined payload sent from the review dialog. */
export interface SubmitReviewPayload {
  exchange_id: string
  reviewer_user_id: string
  reviewed_user_id: string
  user_rating: number // 1–5
  user_comment?: string
  item_reviews: {
    item_id: string
    condition_rating: ItemConditionRating
    comment?: string
  }[]
}

// ─── Display Helpers ─────────────────────────────────────────────────────────

export const ITEM_CONDITION_RATING_LABELS: Record<ItemConditionRating, string> = {
  like_new: 'Like New',
  good: 'Good',
  acceptable: 'Acceptable',
  bad: 'Bad',
}

export const ITEM_CONDITION_RATING_STYLES: Record<ItemConditionRating, string> = {
  like_new: 'bg-success/10 text-success border-success/20',
  good: 'bg-primary/10 text-primary border-primary/20',
  acceptable: 'bg-warning/10 text-warning border-warning/20',
  bad: 'bg-destructive/10 text-destructive border-destructive/20',
}

export const ITEM_CONDITION_RATINGS: ItemConditionRating[] = [
  'like_new',
  'good',
  'acceptable',
  'bad',
]

export function getConditionRatingLabel(rating: string): string {
  return ITEM_CONDITION_RATING_LABELS[rating as ItemConditionRating] ?? rating
}

export function getConditionRatingStyle(rating: string): string {
  return ITEM_CONDITION_RATING_STYLES[rating as ItemConditionRating] ?? ''
}

/** Maximum length for review comments. */
export const REVIEW_COMMENT_MAX_LENGTH = 500

/** Validate a star rating value (1–5 integers). */
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5
}

/** Validate a review comment (optional, max length). */
export function isValidComment(comment: string | undefined): boolean {
  if (!comment) return true
  return comment.length <= REVIEW_COMMENT_MAX_LENGTH
}
