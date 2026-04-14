"use client"

import { useEffect, useState, useCallback } from "react"
import { Heart, Users, List } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getUserListsAction, getUserListMembersAction, removeUserFromListAction } from "@/app/actions/user-list"
import {
  UserListMembers,
  UserListMembersSkeleton,
} from "@/components/sections/favorites/user-list-members"
import type { UserList, UserListMember } from "@/lib/entities/user-list"

// ─── Per-list tab ─────────────────────────────────────────────────────────────

interface UserListTabProps {
  list: UserList
}

function UserListTab({ list }: UserListTabProps) {
  const [members, setMembers] = useState<UserListMember[]>([])
  const [loading, setLoading] = useState(true)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getUserListMembersAction(list.listId)
    if (result.success && result.data) setMembers(result.data)
    setLoading(false)
  }, [list.listId])

  useEffect(() => { load() }, [load])

  const handleRemove = useCallback(async (userId: string) => {
    setRemovingUserId(userId)
    const result = await removeUserFromListAction(list.listId, userId)
    if (result.success) {
      setMembers((prev) => prev.filter((m) => m.userId !== userId))
    }
    setRemovingUserId(null)
  }, [list.listId])

  if (loading) return <UserListMembersSkeleton />

  return (
    <UserListMembers
      members={members}
      listName={list.name}
      onRemove={handleRemove}
      removingUserId={removingUserId}
    />
  )
}

// ─── Main Favorites component ─────────────────────────────────────────────────

export function Favorites() {
  const [lists, setLists] = useState<UserList[]>([])
  const [loadingLists, setLoadingLists] = useState(true)
  const [selectedCustomListId, setSelectedCustomListId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLists() {
      const result = await getUserListsAction()
      if (result.success && result.data) {
        setLists(result.data)
        const custom = result.data.filter((l) => !l.isPredefined)
        if (custom.length > 0) setSelectedCustomListId(custom[0].listId)
      }
      setLoadingLists(false)
    }
    fetchLists()
  }, [])

  const predefinedLists = lists.filter((l) => l.isPredefined)

  // Map predefined list names to their tab values and icons
  const listTabConfig: Record<string, { value: string; icon: React.ReactNode }> = {
    Favorites: { value: "favorites", icon: <Heart className="h-4 w-4" /> },
    "Frequent Users": { value: "frequent", icon: <Users className="h-4 w-4" /> },
  }

  const customLists = lists.filter((l) => !l.isPredefined)
  const selectedCustomList = customLists.find((l) => l.listId === selectedCustomListId) ?? null

  const defaultTab =
    predefinedLists.length > 0
      ? (listTabConfig[predefinedLists[0].name]?.value ?? "favorites")
      : "favorites"

  return (
    <div className="flex min-h-full w-full flex-1 flex-col space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Favorites & Lists</h1>
        <p className="text-muted-foreground mt-1">
          Manage the users you save and interact with most.
        </p>
      </div>

      {loadingLists ? (
        <UserListMembersSkeleton />
      ) : (
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            {predefinedLists.map((list) => {
              const cfg = listTabConfig[list.name]
              if (!cfg) return null
              return (
                <TabsTrigger key={list.listId} value={cfg.value} className="gap-1.5">
                  {cfg.icon}
                  {list.name}
                  {list.memberCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                      {list.memberCount}
                    </Badge>
                  )}
                </TabsTrigger>
              )
            })}
            {customLists.length > 0 && (
              <TabsTrigger value="custom" className="gap-1.5">
                <List className="h-4 w-4" />
                My Lists
                <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0">
                  {customLists.length}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>

          {predefinedLists.map((list) => {
            const cfg = listTabConfig[list.name]
            if (!cfg) return null
            return (
              <TabsContent key={list.listId} value={cfg.value} className="mt-6">
                <UserListTab list={list} />
              </TabsContent>
            )
          })}

          {customLists.length > 0 && (
            <TabsContent value="custom" className="mt-6">
              <div className="mb-4">
                <span className="text-sm text-muted-foreground mr-2">Select a list:</span>
                <select
                  id="custom-list-select"
                  className="rounded-md border border-muted bg-popover text-foreground px-2 py-1.5 text-sm focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-100"
                  value={selectedCustomListId ?? ""}
                  onChange={(e) => setSelectedCustomListId(e.target.value)}
                >
                  {customLists.map((list) => (
                    <option key={list.listId} value={list.listId} style={{ color: "#000000", backgroundColor: "#ffffff" }}>
                      {list.name} ({list.memberCount})
                    </option>
                  ))}
                </select>
              </div>
              {selectedCustomList && <UserListTab key={selectedCustomList.listId} list={selectedCustomList} />}
            </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  )
}
