// ─── User List Domain Types ───────────────────────────────────────────────────

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
