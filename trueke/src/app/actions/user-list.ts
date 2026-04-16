"use server"

import { revalidatePath } from "next/cache"
import { getAuthenticatedUserId } from "@/utils/auth-server"
import {
  getUserLists,
  getUserListMembers,
  addUserToList,
  removeUserFromList,
} from "@/utils/entities/user-list"
import type { ApiResponse } from "@/lib/types"
import type { UserList, UserListMember } from "@/lib/entities/user-list"

/** Returns all user lists owned by the authenticated user. */
export async function getUserListsAction(): Promise<ApiResponse<UserList[]>> {
  const userId = await getAuthenticatedUserId()
  if (!userId) return { success: false, error: "Not authenticated." }

  const lists = await getUserLists(userId)
  return { success: true, data: lists }
}

/** Returns all members of a specific list with their profile and rating. */
export async function getUserListMembersAction(
  listId: string
): Promise<ApiResponse<UserListMember[]>> {
  if (!listId?.trim()) return { success: false, error: "List ID is required." }

  const members = await getUserListMembers(listId)
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

  const { error } = await addUserToList(listId, memberUserId)
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

  const { error } = await removeUserFromList(listId, memberUserId)
  if (error) return { success: false, error }

  revalidatePath("/favorites")
  return { success: true, data: null }
}
