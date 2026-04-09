'use server'

import { createClient } from '@/utils/supabase/server'
import { createNotification } from '@/utils/entities/notification'
import type { ApiResponse } from '@/lib/types'
import type {
  Review,
  ItemReview,
  UserRatingSummary,
  SubmitReviewPayload,
} from '@/lib/entities/review'
import {
  isValidRating,
  isValidComment,
  REVIEW_COMMENT_MAX_LENGTH,
  ITEM_CONDITION_RATINGS,
} from '@/lib/entities/review'
import type { ItemConditionRating } from '@/lib/entities/review'

// ─── Write Operations ────────────────────────────────────────────────────────

/**
 * Submit a full review: user rating + item condition reviews for a completed exchange.
 * Validates the exchange is completed & the reviewer is a participant.
 */
export async function submitReview(
  payload: SubmitReviewPayload
): Promise<ApiResponse<null>> {
  try {
    const supabase = await createClient()

    // ─── Validation ──────────────────────────────────────────────
    if (!isValidRating(payload.user_rating)) {
      return { success: false, error: 'Rating must be between 1 and 5.' }
    }

    if (!isValidComment(payload.user_comment)) {
      return {
        success: false,
        error: `Comment must be ${REVIEW_COMMENT_MAX_LENGTH} characters or fewer.`,
      }
    }

    for (const ir of payload.item_reviews) {
      if (!ITEM_CONDITION_RATINGS.includes(ir.condition_rating)) {
        return { success: false, error: `Invalid item condition rating: ${ir.condition_rating}` }
      }
      if (!isValidComment(ir.comment)) {
        return {
          success: false,
          error: `Item review comment must be ${REVIEW_COMMENT_MAX_LENGTH} characters or fewer.`,
        }
      }
    }

    // ─── Authorization: verify exchange is completed & user is participant ──
    const { data: exchangeRow, error: exchangeError } = await supabase
      .from('exchange')
      .select('exchange_id, status')
      .eq('exchange_id', payload.exchange_id)
      .single()

    if (exchangeError || !exchangeRow) {
      return { success: false, error: 'Exchange not found.' }
    }

    if (exchangeRow.status !== 'completed') {
      return { success: false, error: 'Reviews can only be submitted for completed exchanges.' }
    }

    const { data: participants } = await supabase
      .from('exchange_participant')
      .select('user_id')
      .eq('exchange_id', payload.exchange_id)

    const participantIds = (participants || []).map((p: any) => p.user_id)

    if (!participantIds.includes(payload.reviewer_user_id)) {
      return { success: false, error: 'You are not a participant in this exchange.' }
    }

    if (!participantIds.includes(payload.reviewed_user_id)) {
      return { success: false, error: 'Invalid reviewed user.' }
    }

    if (payload.reviewer_user_id === payload.reviewed_user_id) {
      return { success: false, error: 'You cannot review yourself.' }
    }

    // ─── Check for duplicate review ─────────────────────────────
    const { data: existingReview } = await supabase
      .from('review')
      .select('review_id')
      .eq('exchange_id', payload.exchange_id)
      .eq('reviewer_user_id', payload.reviewer_user_id)
      .maybeSingle()

    if (existingReview) {
      return { success: false, error: 'You have already submitted a review for this exchange.' }
    }

    // ─── Insert user review ─────────────────────────────────────
    const { error: reviewError } = await supabase.from('review').insert({
      exchange_id: payload.exchange_id,
      reviewer_user_id: payload.reviewer_user_id,
      reviewed_user_id: payload.reviewed_user_id,
      rating: payload.user_rating,
      comment: payload.user_comment || null,
    })

    if (reviewError) {
      return { success: false, error: reviewError.message }
    }

    // ─── Insert item condition reviews ──────────────────────────
    if (payload.item_reviews.length > 0) {
      const itemReviewRows = payload.item_reviews.map((ir) => ({
        exchange_id: payload.exchange_id,
        reviewer_user_id: payload.reviewer_user_id,
        item_id: ir.item_id,
        condition_rating: ir.condition_rating,
        comment: ir.comment || null,
      }))

      const { error: itemReviewError } = await supabase
        .from('item_review')
        .insert(itemReviewRows)

      if (itemReviewError) {
        console.error('Error inserting item reviews:', itemReviewError)
        // Don't fail the whole operation — user review is already saved
      }
    }

    // ─── Notify the reviewed user ───────────────────────────────
    await createNotification({
      recipient_user_id: payload.reviewed_user_id,
      sender_user_id: payload.reviewer_user_id,
      type: 'rating_received',
      title: 'New Review Received',
      body: `You received a ${payload.user_rating}-star review for a completed trade.`,
      reference_type: 'exchange',
      reference_id: payload.exchange_id,
    })

    return { success: true, message: 'Review submitted successfully.' }
  } catch (err) {
    console.error('Error submitting review:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred.',
    }
  }
}

// ─── Read Operations ─────────────────────────────────────────────────────────

/**
 * Get the aggregated rating summary for a user.
 */
export async function getUserRatingSummary(
  userId: string
): Promise<ApiResponse<UserRatingSummary>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_rating_summary')
      .select('user_id, average_rating, total_reviews')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data: data
        ? {
            user_id: data.user_id,
            average_rating: Number(data.average_rating),
            total_reviews: data.total_reviews,
          }
        : {
            user_id: userId,
            average_rating: 0,
            total_reviews: 0,
          },
    }
  } catch (err) {
    console.error('Error fetching user rating summary:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred.',
    }
  }
}

/**
 * Get all reviews received by a user (for profile display).
 * Batch-resolves reviewer names to avoid N+1.
 */
export async function getUserReviews(
  userId: string,
  limit = 20
): Promise<ApiResponse<Review[]>> {
  try {
    const supabase = await createClient()

    const { data: rows, error } = await supabase
      .from('review')
      .select('review_id, exchange_id, reviewer_user_id, reviewed_user_id, rating, comment, created_at')
      .eq('reviewed_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { success: false, error: error.message }
    }

    if (!rows || rows.length === 0) {
      return { success: true, data: [] }
    }

    // Batch-resolve reviewer names
    const reviewerIds = Array.from(new Set(rows.map((r: any) => r.reviewer_user_id)))
    const { data: userRows } = await supabase
      .from('user')
      .select('user_id, username, profile_picture_url')
      .in('user_id', reviewerIds)

    const reviewerMap = new Map<string, { name: string; avatar: string }>()
    for (const u of userRows || []) {
      reviewerMap.set(u.user_id, {
        name: u.username,
        avatar: u.profile_picture_url || '',
      })
    }

    const reviews: Review[] = rows.map((row: any) => {
      const reviewer = reviewerMap.get(row.reviewer_user_id)
      return {
        review_id: row.review_id,
        exchange_id: row.exchange_id,
        reviewer_user_id: row.reviewer_user_id,
        reviewed_user_id: row.reviewed_user_id,
        rating: row.rating,
        comment: row.comment,
        created_at: row.created_at,
        reviewer_name: reviewer?.name ?? 'Unknown',
        reviewer_avatar: reviewer?.avatar ?? '',
      }
    })

    return { success: true, data: reviews }
  } catch (err) {
    console.error('Error fetching user reviews:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred.',
    }
  }
}

/**
 * Check if the current user has already reviewed a specific exchange.
 */
export async function hasUserReviewedExchange(
  exchangeId: string,
  userId: string
): Promise<ApiResponse<boolean>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('review')
      .select('review_id')
      .eq('exchange_id', exchangeId)
      .eq('reviewer_user_id', userId)
      .maybeSingle()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: !!data }
  } catch (err) {
    console.error('Error checking review status:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred.',
    }
  }
}

/**
 * Get item condition reviews for a specific item.
 */
export async function getItemReviews(
  itemId: string
): Promise<ApiResponse<ItemReview[]>> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('item_review')
      .select('item_review_id, exchange_id, reviewer_user_id, item_id, condition_rating, comment, created_at')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: (data || []) as ItemReview[] }
  } catch (err) {
    console.error('Error fetching item reviews:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'An error occurred.',
    }
  }
}
