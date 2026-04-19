// ─── User List Domain Types ───────────────────────────────────────────────────
import { z } from "zod"
/** A list of users owned by a single user (e.g. "Favorites", "Frequent Users"). */
export interface UserList {
  listId: string
  ownerId: string
  name: string
  description: string | null
  isPredefined: boolean
  createdAt: string
  memberCount: number
}

/** A member of a user list, enriched with public profile and rating data. */
export interface UserListMember {
  listId: string
  userId: string
  username: string
  firstName: string
  lastName: string
  profilePictureUrl: string
  averageRating: number
  totalReviews: number
  addedAt: string
}

/** User List Zod Schema for Create List Form Validation */
export const UserListFormSchema = z.object({
  name: z.string().min(1, "List name is required").max(50, "List name must be at most 50 characters"),
  description: z.string().max(200, "Description must be at most 200 characters").optional(),
})

