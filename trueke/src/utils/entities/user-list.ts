import { createClient } from "@/utils/supabase/server"
import type { UserList, UserListMember } from "@/lib/entities/user-list"

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Returns all user lists owned by `userId`, including a member count.
 * Predefined lists ("Favorites" and "Frequent Users") are always returned first.
 */
export async function getUserLists(userId: string): Promise<UserList[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_list")
    .select("list_id, owner_id, name, description, is_predefined, created_at, user_list_member(count)")
    .eq("owner_id", userId)
    .order("is_predefined", { ascending: false })
    .order("created_at", { ascending: true })

  if (error || !data) return []

  return data.map((row: any) => ({
    listId: row.list_id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    isPredefined: row.is_predefined,
    createdAt: row.created_at,
    memberCount: row.user_list_member?.[0]?.count ?? 0,
  }))
}

/**
 * Returns all members of a given list enriched with public profile data and
 * their aggregated rating from the `user_rating_summary` view.
 */
export async function getUserListMembers(listId: string): Promise<UserListMember[]> {
  const supabase = await createClient()

  // Step 1: fetch list members with their basic profile
  const { data: memberRows, error } = await supabase
    .from("user_list_member")
    .select(`
      list_id,
      added_date_time,
      member_user_id,
      user:member_user_id (
        user_id,
        username,
        first_name,
        last_name,
        profile_picture_url
      )
    `)
    .eq("list_id", listId)
    .order("added_date_time", { ascending: true })

  if (error || !memberRows || memberRows.length === 0) return []

  const userIds = memberRows.map((r: any) => r.member_user_id)

  // Step 2: fetch ratings for all members in one query
  const { data: ratingRows } = await supabase
    .from("user_rating_summary")
    .select("user_id, average_rating, total_reviews")
    .in("user_id", userIds)

  const ratingMap = new Map<string, { averageRating: number; totalReviews: number }>()
  for (const r of ratingRows ?? []) {
    ratingMap.set(r.user_id, {
      averageRating: Number(r.average_rating),
      totalReviews: r.total_reviews,
    })
  }

  return memberRows.map((row: any) => {
    const user = row.user
    const rating = ratingMap.get(row.member_user_id)
    return {
      listId: row.list_id,
      userId: row.member_user_id,
      username: user?.username ?? "",
      firstName: user?.first_name ?? "",
      lastName: user?.last_name ?? "",
      profilePictureUrl: user?.profile_picture_url ?? "",
      averageRating: rating?.averageRating ?? 0,
      totalReviews: rating?.totalReviews ?? 0,
      addedAt: row.added_date_time,
    }
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/** Adds `memberUserId` to the given list. Returns an error string or null. */
export async function addUserToList(
  listId: string,
  memberUserId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("user_list_member")
    .insert({ list_id: listId, member_user_id: memberUserId })

  if (error) {
    if (error.code === "23505") return { error: "User is already in this list." }
    return { error: error.message }
  }

  return { error: null }
}

/** Removes `memberUserId` from the given list. Returns an error string or null. */
export async function removeUserFromList(
  listId: string,
  memberUserId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("user_list_member")
    .delete()
    .eq("list_id", listId)
    .eq("member_user_id", memberUserId)

  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Ensures the two predefined lists exist for `userId`.
 * Called at registration as a safety net alongside the DB trigger.
 */
export async function ensurePredefinedLists(userId: string): Promise<void> {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("user_list")
    .select("name")
    .eq("owner_id", userId)
    .eq("is_predefined", true)

  const existingNames = new Set((existing ?? []).map((r: any) => r.name))

  const toCreate = (
    [
      { name: "Favorites", description: "Your saved favorite users" },
      { name: "Frequent Users", description: "Users you interact with frequently" },
    ] as const
  ).filter((l) => !existingNames.has(l.name))

  if (toCreate.length === 0) return

  await supabase.from("user_list").insert(
    toCreate.map((l) => ({
      owner_id: userId,
      name: l.name,
      description: l.description,
      is_predefined: true,
    }))
  )
}
