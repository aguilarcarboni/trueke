"use server"

import { revalidatePath } from "next/cache"
import { getAuthenticatedUserId } from "@/utils/auth-server"
import {
  getUserLists,
  getUserListMembers,
  addUserToList,
  removeUserFromList,
  createCustomList,
  deleteCustomList,
  searchUsersForList,
  getUserListFiltered,
} from "@/utils/entities/user-list"
import type { ApiResponse } from "@/lib/types"
import type { UserList, UserListMember, UserSearchResult } from "@/lib/entities/user-list"
import { UserListFormSchema } from "@/lib/entities/user-list"

/** Returns all user lists owned by the authenticated user. */
export async function getUserListsAction(): Promise<ApiResponse<UserList[]>> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { success: false, error: "Not authenticated." }

  const lists = await getUserLists(userId)
  return { success: true, data: lists }
}

/** Returns all members of a list owned by the authenticated user. */
export async function getUserListMembersAction(
  listId: string
): Promise<ApiResponse<UserListMember[]>> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { success: false, error: "Not authenticated." }
  if (!listId?.trim()) return { success: false, error: "List ID is required." }

  const members = await getUserListMembers(userId, listId.trim())
  return { success: true, data: members }
}

/** Adds a user to a list owned by the authenticated user. */
export async function addUserToListAction(
  listId: string,
  memberUserId: string
): Promise<ApiResponse<null>> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { success: false, error: "Not authenticated." }
  if (!listId?.trim() || !memberUserId?.trim()) {
    return { success: false, error: "List ID and user ID are required." }
  }

  const { error } = await addUserToList(userId, listId.trim(), memberUserId.trim())
  if (error) return { success: false, error }

  revalidatePath("/favorites")
  return { success: true, data: null }
}

/** Removes a user from a list owned by the authenticated user. */
export async function removeUserFromListAction(
  listId: string,
  memberUserId: string
): Promise<ApiResponse<null>> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { success: false, error: "Not authenticated." }
  if (!listId?.trim() || !memberUserId?.trim()) {
    return { success: false, error: "List ID and user ID are required." }
  }

  const { error } = await removeUserFromList(userId, listId.trim(), memberUserId.trim())
  if (error) return { success: false, error }

  revalidatePath("/favorites")
  return { success: true, data: null }
}

/** Creates a new custom list for the authenticated user. */
export async function createCustomListAction(
  name: string,
  description?: string
): Promise<ApiResponse<{ listId: string }>> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { success: false, error: "Not authenticated." }

  const parsed = UserListFormSchema.safeParse({ name, description })
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]
    return { success: false, error: firstError?.message ?? "Invalid input." }
  }

  const { error, listId } = await createCustomList(userId, parsed.data.name, parsed.data.description)
  if (error) return { success: false, error }
  if (!listId) return { success: false, error: "Failed to create list." }

  revalidatePath("/favorites")
  return { success: true, data: { listId } }
}

/**
 * Deletes a custom list owned by the authenticated user.
 *
 * Predefined lists are protected at the data layer; any attempt to delete one
 * returns an error ("List not found or cannot be deleted").
 */
export async function deleteCustomListAction(
  listId: string
): Promise<ApiResponse<null>> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { success: false, error: "Not authenticated." }
  if (!listId?.trim()) return { success: false, error: "List ID is required." }

  const { error } = await deleteCustomList(userId, listId.trim())
  if (error) return { success: false, error }

  revalidatePath("/favorites")
  return { success: true, data: null }
}

/** Returns lists owned by the authenticated user that don't yet contain `toAddUserId`. */
export async function getUserListFilteredAction(
  toAddUserId: string
): Promise<ApiResponse<UserList[]>> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { success: false, error: "Not authenticated." }
  if (!toAddUserId?.trim()) return { success: false, error: "User ID is required." }

  const lists = await getUserListFiltered(userId, toAddUserId.trim())
  return { success: true, data: lists }
}

/**
 * Searches for users by username / first name / last name.
 * Excludes users already in the list (`existingMemberIds`) and the caller.
 */
export async function searchUsersForListAction(
  query: string,
  existingMemberIds: string[]
): Promise<ApiResponse<UserSearchResult[]>> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { success: false, error: "Not authenticated." }
  if (!query?.trim()) return { success: true, data: [] }

  const excludeIds = Array.from(new Set([userId, ...existingMemberIds]))
  const results = await searchUsersForList(query.trim(), excludeIds)
  return { success: true, data: results }
}