import { createClient } from "@/utils/supabase/server"
import type { UserList, UserListMember, UserSearchResult } from "@/lib/entities/user-list"

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

export async function createCustomList(
  userId: string, 
  name: string, 
  description?: string
): Promise<{ error: string | null; listId?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_list")
    .insert({
      owner_id: userId,
      name: name, 
      description: description ?? null,
      is_predefined: false, 
    })
    .select("list_id")
  
  if (error || !data || data.length === 0) {
    return { error: error?.message ?? "Failed to create list." }
  }

  return { error: null, listId: data[0].list_id }
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

/**
 * Searches for users matching `query` against username, first_name, and last_name.
 * Excludes any user ids in `excludeUserIds` (caller + existing members).
 * Returns at most 20 results.
 */
export async function searchUsersForList(
  query: string,
  excludeUserIds: string[]
): Promise<UserSearchResult[]> {
  const supabase = await createClient()
  const q = query.trim().split(/\s+/).join(" ") // Normalize whitespace
  if (!q) return []

  const parts = q.split(/\s+/).filter(Boolean)
  const orParts: string[] = [
    `username.ilike.%${q}%`,
    `first_name.ilike.%${q}%`,
    `last_name.ilike.%${q}%`,
  ]

  if (parts.length >= 2) {
    // "John Doe" → match first_name LIKE %John% AND last_name LIKE %Doe%, and reversed
    const [first, ...rest] = parts
    const last = rest.join(" ")
    orParts.push(`and(first_name.ilike.%${first}%,last_name.ilike.%${last}%)`)
    orParts.push(`and(first_name.ilike.%${last}%,last_name.ilike.%${first}%)`)
  }

  let req = supabase
    .from("user")
    .select("user_id, username, first_name, last_name, profile_picture_url")
    .or(orParts.join(","))
    .limit(20)

  if (excludeUserIds.length > 0) {
    req = req.not("user_id", "in", `(${excludeUserIds.join(",")})`)
  }

  const { data, error } = await req

  if (error || !data) return []

  const userIds = data.map((u: any) => u.user_id)

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

  return data.map((u: any) => {
    const rating = ratingMap.get(u.user_id)
    return {
      userId: u.user_id,
      username: u.username ?? "",
      firstName: u.first_name ?? "",
      lastName: u.last_name ?? "",
      profilePictureUrl: u.profile_picture_url ?? "",
      averageRating: rating?.averageRating ?? 0,
      totalReviews: rating?.totalReviews ?? 0,
    }
  })
}

/**
 * Returns all lists owned by `userId` where `toAddUserId` is not yet a member.
 * Predefined lists are ordered first, then by creation date.
 */
export async function getUserListFiltered(
  userId: string,
  toAddUserId: string
): Promise<UserList[]> {
  const supabase = await createClient()

  // Step 1: find list IDs that already contain toAddUserId
  const { data: memberRows } = await supabase
    .from("user_list_member")
    .select("list_id")
    .eq("member_user_id", toAddUserId)

  const alreadyMemberListIds = (memberRows ?? []).map((r: any) => r.list_id as string)

  // Step 2: fetch all lists owned by userId, excluding those
  let query = supabase
    .from("user_list")
    .select("list_id, owner_id, name, description, is_predefined, created_at, user_list_member(count)")
    .eq("owner_id", userId)
    .order("is_predefined", { ascending: false })
    .order("created_at", { ascending: true })

  if (alreadyMemberListIds.length > 0) {
    query = query.not("list_id", "in", `(${alreadyMemberListIds.join(",")})`)
  }

  const { data, error } = await query

  if (error || !data) return []

  return data.map((d: any) => ({
    listId: d.list_id,
    ownerId: d.owner_id,
    name: d.name,
    description: d.description,
    isPredefined: d.is_predefined,
    createdAt: d.created_at,
    memberCount: d.user_list_member?.[0]?.count ?? 0,
  }))
}
