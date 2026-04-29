import { createClient } from "@/utils/supabase/server"
import type { UserList, UserListMember, UserSearchResult } from "@/lib/entities/user-list"

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

// ─── Private Helpers ─────────────────────────────────────────────────────────

async function getOwnedListId(
  supabase: SupabaseClient,
  userId: string,
  listId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("user_list")
    .select("list_id")
    .eq("list_id", listId)
    .eq("owner_id", userId)
    .maybeSingle()

  if (error || !data) return null
  return (data as { list_id: string }).list_id
}

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
 * Returns all members of a list owned by `userId`, enriched with public profile
 * data and rating data.
 *
 * If the list does not belong to `userId`, this returns an empty array instead
 * of exposing whether the list exists or who it contains.
 */
export async function getUserListMembers(
  userId: string,
  listId: string
): Promise<UserListMember[]> {
  const supabase = await createClient()

  const ownedListId = await getOwnedListId(supabase, userId, listId)
  if (!ownedListId) return []

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
    .eq("list_id", ownedListId)
    .order("added_date_time", { ascending: true })

  if (error || !memberRows || memberRows.length === 0) return []

  const userIds = memberRows.map((r: any) => r.member_user_id)

  const { data: locRows } = await supabase
    .from("user_address")
    .select(
      `
      user_id,
      address:address_id (
        canton_city,
        province_state
      )
    `
    )
    .in("user_id", userIds)
    .eq("is_current", true)

  const locationByUser = new Map<string, string>()
  for (const row of locRows ?? []) {
    const addr = row.address as { canton_city?: string; province_state?: string } | null
    const city = addr?.canton_city?.trim() ?? ""
    const prov = addr?.province_state?.trim() ?? ""
    const parts = [city, prov].filter(Boolean)
    locationByUser.set(row.user_id as string, parts.join(", "))
  }

  const { data: epRows } = await supabase
    .from("exchange_participant")
    .select("user_id, exchange_id, exchange ( status )")
    .in("user_id", userIds)

  const tradeSets = new Map<string, Set<string>>()
  for (const row of epRows ?? []) {
    const raw = row.exchange as { status: string } | { status: string }[] | null
    const st = Array.isArray(raw) ? raw[0]?.status : raw?.status
    if (st !== "completed") continue

    const uid = row.user_id as string
    const eid = row.exchange_id as string

    if (!tradeSets.has(uid)) tradeSets.set(uid, new Set())
    tradeSets.get(uid)!.add(eid)
  }

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
    const uid = row.member_user_id as string

    return {
      listId: row.list_id,
      userId: uid,
      username: user?.username ?? "",
      firstName: user?.first_name ?? "",
      lastName: user?.last_name ?? "",
      profilePictureUrl: user?.profile_picture_url ?? "",
      locationLabel: locationByUser.get(uid) ?? "",
      averageRating: rating?.averageRating ?? 0,
      totalReviews: rating?.totalReviews ?? 0,
      tradeCount: tradeSets.get(uid)?.size ?? 0,
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
      name,
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

/**
 * Adds `memberUserId` to a list owned by `userId`.
 *
 * No notifications are created here. Adding a user to a private list should not
 * create any public indication for the added user.
 */
export async function addUserToList(
  userId: string,
  listId: string,
  memberUserId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const ownedListId = await getOwnedListId(supabase, userId, listId)
  if (!ownedListId) return { error: "List not found." }

  const { error } = await supabase
    .from("user_list_member")
    .insert({ list_id: ownedListId, member_user_id: memberUserId })

  if (error) {
    if (error.code === "23505") return { error: "User is already in this list." }
    return { error: error.message }
  }

  return { error: null }
}

/** Removes `memberUserId` from a list owned by `userId`. */
export async function removeUserFromList(
  userId: string,
  listId: string,
  memberUserId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const ownedListId = await getOwnedListId(supabase, userId, listId)
  if (!ownedListId) return { error: "List not found." }

  const { error } = await supabase
    .from("user_list_member")
    .delete()
    .eq("list_id", ownedListId)
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
 * Deletes a custom list owned by `userId`.
 *
 * Predefined lists are protected server-side by the `is_predefined = false`
 * filter. Membership rows are removed by ON DELETE CASCADE.
 */
export async function deleteCustomList(
  userId: string,
  listId: string
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_list")
    .delete()
    .eq("list_id", listId)
    .eq("owner_id", userId)
    .eq("is_predefined", false)
    .select("list_id")

  if (error) return { error: error.message }
  if (!data || data.length === 0) {
    return { error: "List not found or cannot be deleted." }
  }

  return { error: null }
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
  const q = query.trim().split(/\s+/).join(" ")
  if (!q) return []

  const parts = q.split(/\s+/).filter(Boolean)
  const orParts: string[] = [
    `username.ilike.%${q}%`,
    `first_name.ilike.%${q}%`,
    `last_name.ilike.%${q}%`,
  ]

  if (parts.length >= 2) {
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

  const { data: listRows, error } = await supabase
    .from("user_list")
    .select("list_id, owner_id, name, description, is_predefined, created_at, user_list_member(count)")
    .eq("owner_id", userId)
    .order("is_predefined", { ascending: false })
    .order("created_at", { ascending: true })

  if (error || !listRows || listRows.length === 0) return []

  const ownedListIds = listRows.map((row: any) => row.list_id as string)

  const { data: memberRows } = await supabase
    .from("user_list_member")
    .select("list_id")
    .eq("member_user_id", toAddUserId)
    .in("list_id", ownedListIds)

  const alreadyMemberListIds = new Set((memberRows ?? []).map((row: any) => row.list_id as string))

  return listRows
    .filter((row: any) => !alreadyMemberListIds.has(row.list_id))
    .map((row: any) => ({
      listId: row.list_id,
      ownerId: row.owner_id,
      name: row.name,
      description: row.description,
      isPredefined: row.is_predefined,
      createdAt: row.created_at,
      memberCount: row.user_list_member?.[0]?.count ?? 0,
    }))
}