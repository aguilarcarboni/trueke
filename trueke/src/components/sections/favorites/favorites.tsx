"use client"

import { useEffect, useState, useCallback } from "react"
import { Heart, Users, List, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getUserListsAction, getUserListMembersAction, removeUserFromListAction } from "@/app/actions/user-list"
import {
  UserListMembers,
  UserListMembersSkeleton,
} from "@/components/sections/favorites/user-list-members"
import type { UserList, UserListMember } from "@/lib/entities/user-list"
import { cn } from "@/lib/utils"
import { CreateCustomListDialog } from "@/components/sections/favorites/create-custom-list-dialog"

// ─── Per-list panel ───────────────────────────────────────────────────────────

interface UserListPanelProps {
  list: UserList
}

function UserListPanel({ list }: UserListPanelProps) {
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

// ─── Icon helper ──────────────────────────────────────────────────────────────
const listIcon: Record<string, React.ReactNode> = {
  Favorites: <Heart className="h-3.5 w-3.5" />,
  "Frequent Users": <Users className="h-3.5 w-3.5" />,
}

function getListIcon(name: string) {
  return listIcon[name] ?? <List className="h-3.5 w-3.5" />
}

// ─── Main Favorites component ─────────────────────────────────────────────────

export function Favorites() {
  const [lists, setLists] = useState<UserList[]>([])
  const [loadingLists, setLoadingLists] = useState(true)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [showCustomLists, setShowCustomLists] = useState(false)

  useEffect(() => {
    async function fetchLists() {
      const result = await getUserListsAction()
      if (result.success && result.data) {
        setLists(result.data)
        const first = result.data[0]
        if (first) setSelectedListId(first.listId)
      }
      setLoadingLists(false)
    }
    fetchLists()
  }, [])

  const predefinedLists = lists.filter((l) => l.isPredefined && l.name !== "Blocked Users")
  const customLists = lists.filter((l) => !l.isPredefined)
  const selectedList = lists.find((l) => l.listId === selectedListId) ?? null

  function selectPredefined(listId: string) {
    setSelectedListId(listId)
    setShowCustomLists(false)
  }

  function selectCustomList(listId: string) {
    setSelectedListId(listId)
    setShowCustomLists(false)
  }

  return (
    <div className="flex min-h-full w-full flex-1 flex-col space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Favorites & Lists</h1>
        <p className="text-muted-foreground mt-1">
          Manage the users you save and interact with most.
        </p>
      </div>

      {loadingLists ? (
        <UserListMembersSkeleton />
      ) : (
        <>
          {/* ── Chip bar ──────────────────────────────────────── */}
          <div className="flex items-center gap-2 pb-1" role="listbox" aria-label="Select a list">
            {/* Predefined chips */}
            {predefinedLists.map((list) => (
              <button
                key={list.listId}
                type="button"
                role="option"
                aria-selected={selectedListId === list.listId && !showCustomLists}
                onClick={() => selectPredefined(list.listId)}
                className={cn(
                  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors shrink-0",
                  selectedListId === list.listId && !showCustomLists
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {getListIcon(list.name)}
                {list.name}
                {list.memberCount > 0 && (
                  <Badge
                    variant={selectedListId === list.listId && !showCustomLists ? "outline" : "secondary"}
                    className={cn(
                      "ml-0.5 text-xs px-1.5 py-0",
                      selectedListId === list.listId && !showCustomLists && "border-primary-foreground/30 text-primary-foreground"
                    )}
                  >
                    {list.memberCount}
                  </Badge>
                )}
              </button>
            ))}

            {/* Custom Lists chip */}
            <button
              type="button"
              role="option"
              aria-selected={showCustomLists}
              onClick={() => setShowCustomLists(true)}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition-colors shrink-0",
                showCustomLists
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Custom Lists
              {customLists.length > 0 && (
                <Badge
                  variant={showCustomLists ? "outline" : "secondary"}
                  className={cn(
                    "ml-0.5 text-xs px-1.5 py-0",
                    showCustomLists && "border-primary-foreground/30 text-primary-foreground"
                  )}
                >
                  {customLists.length}
                </Badge>
              )}
            </button>

          </div>

          {/* ── Content ───────────────────────────────────────── */}
          {showCustomLists ? (
            <CustomListsView
              customLists={customLists}
              onSelect={selectCustomList}
              onListCreated={(listId, name) => {
                setLists((prev) => [
                  ...prev,
                  { listId, name, isPredefined: false, memberCount: 0 } as UserList,
                ])
              }}
            />
          ) : selectedList ? (
            <UserListPanel key={selectedList.listId} list={selectedList} />
          ) : (
            <p className="text-sm text-muted-foreground text-center py-12">
              No lists available.
            </p>
          )}
        </>
      )}
    </div>
  )
}

// ─── Custom Lists view (grid of list cards) ───────────────────────────────────

interface CustomListsViewProps {
  customLists: UserList[]
  onSelect: (listId: string) => void
  onListCreated: (listId: string, name: string) => void
}

function CustomListsView({ customLists, onSelect, onListCreated }: CustomListsViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="space-y-4">
      <CreateCustomListDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={onListCreated}
      />

      {/* Create list button */}
      <div>
        <Button
          variant="default"
          size="sm"
          className="gap-1.5"
          aria-label="Create new list"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Create List
        </Button>
      </div>

      {customLists.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <List className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No custom lists yet</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Create a list to organize your contacts however you like.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {customLists.map((list) => (
        <button
          key={list.listId}
          type="button"
          onClick={() => onSelect(list.listId)}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <List className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{list.name}</p>
            <p className="text-xs text-muted-foreground">
              {list.memberCount} {list.memberCount === 1 ? "member" : "members"}
            </p>
          </div>
          </button>
        ))}
        </div>
      )}
    </div>
  )
}
