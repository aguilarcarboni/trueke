"use client"

import { useEffect, useState, useCallback } from "react"
import { Heart, Users, List, Plus, Trash2, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  getUserListsAction,
  getUserListMembersAction,
  removeUserFromListAction,
  deleteCustomListAction,
} from "@/app/actions/user-list"
import {
  UserListMembers,
  UserListMembersSkeleton,
} from "@/components/sections/favorites/user-list-members"
import { UserProfileDialog } from "@/components/sections/exchanges/user-profile-dialog"
import type { UserList, UserListMember } from "@/lib/entities/user-list"
import { cn } from "@/lib/utils"
import { CreateCustomListDialog } from "@/components/sections/favorites/create-custom-list-dialog"
import { AddUserToListDialog } from "@/components/sections/favorites/add-user-to-list-dialog"
import { ConfirmActionDialog } from "@/components/sections/exchanges/confirm-action-dialog"
import { useToast } from "@/hooks/use-toast"

// ─── Per-list panel ───────────────────────────────────────────────────────────

interface UserListPanelProps {
  list: UserList
  onBackToAllCustomLists?: () => void
}

function UserListPanel({ list, onBackToAllCustomLists }: UserListPanelProps) {
  const [members, setMembers] = useState<UserListMember[]>([])
  const [loading, setLoading] = useState(true)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const [memberPendingRemoval, setMemberPendingRemoval] = useState<UserListMember | null>(null)
  const [profileUserId, setProfileUserId] = useState<string | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getUserListMembersAction(list.listId)
    if (result.success && result.data) setMembers(result.data)
    setLoading(false)
  }, [list.listId])

  useEffect(() => { load() }, [load])

  const requestRemove = useCallback((userId: string) => {
    const target = members.find((m) => m.userId === userId)
    if (target) setMemberPendingRemoval(target)
  }, [members])

  const handleConfirmRemove = useCallback(async () => {
    if (!memberPendingRemoval) return
    const userId = memberPendingRemoval.userId
    setRemovingUserId(userId)
    const result = await removeUserFromListAction(list.listId, userId)
    setRemovingUserId(null)

    if (!result.success) {
      toast({
        title: "Could not remove user",
        description: result.error ?? "Something went wrong.",
        variant: "destructive",
      })
      return
    }

    setMembers((prev) => prev.filter((m) => m.userId !== userId))
    setMemberPendingRemoval(null)
    toast({
      title: "User removed",
      description: `@${memberPendingRemoval.username} was removed from "${list.name}".`,
    })
  }, [memberPendingRemoval, list.listId, list.name, toast])

  if (loading) return <UserListMembersSkeleton />

  const pendingName =
    memberPendingRemoval
      ? `${memberPendingRemoval.firstName} ${memberPendingRemoval.lastName}`.trim() ||
        `@${memberPendingRemoval.username}`
      : ""

  return (
    <>
      {!list.isPredefined && onBackToAllCustomLists && (
        <div className="mb-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2 h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={onBackToAllCustomLists}
          >
            <ArrowLeft className="h-4 w-4" />
            All custom lists
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{members.length}</span>{" "}
          {members.length === 1 ? "member" : "members"} in this list
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={() => setAddDialogOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Add User
          </Button>
        </div>
        <UserListMembers
          members={members}
          listName={list.name}
          onRemove={requestRemove}
          removingUserId={removingUserId}
          onMemberClick={(userId) => setProfileUserId(userId)}
        />

        <AddUserToListDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          listId={list.listId}
          listName={list.name}
          existingMemberIds={members.map((m) => m.userId)}
          onUserAdded={() => load()}
        />
      </div>

      <ConfirmActionDialog
        open={memberPendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open && removingUserId === null) setMemberPendingRemoval(null)
        }}
        title={`Remove ${pendingName} from "${list.name}"?`}
        description="They'll no longer appear in this list. This does not affect the user's account or any other lists they belong to."
        confirmLabel="Remove from list"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={removingUserId !== null && removingUserId === memberPendingRemoval?.userId}
        onConfirm={handleConfirmRemove}
      />

      <UserProfileDialog
        userId={profileUserId}
        open={profileUserId !== null}
        onOpenChange={(open) => {
          if (!open) setProfileUserId(null)
        }}
        showActiveListings
      />
    </>
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
                <Badge
                  variant={selectedListId === list.listId && !showCustomLists ? "outline" : "secondary"}
                  className={cn(
                    "ml-0.5 text-xs px-1.5 py-0",
                    selectedListId === list.listId && !showCustomLists && "border-primary-foreground/30 text-primary-foreground"
                  )}
                >
                  {list.memberCount}
                </Badge>
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
              onListDeleted={(listId) => {
                setLists((prev) => prev.filter((l) => l.listId !== listId))
                // If we were viewing the deleted list, fall back to the first predefined list
                setSelectedListId((current) =>
                  current === listId
                    ? (predefinedLists[0]?.listId ?? null)
                    : current
                )
              }}
            />
          ) : selectedList ? (
            <UserListPanel
              key={selectedList.listId}
              list={selectedList}
              onBackToAllCustomLists={
                !selectedList.isPredefined
                  ? () => setShowCustomLists(true)
                  : undefined
              }
            />
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
  onListDeleted: (listId: string) => void
}

function CustomListsView({
  customLists,
  onSelect,
  onListCreated,
  onListDeleted,
}: CustomListsViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [listPendingDelete, setListPendingDelete] = useState<UserList | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  const handleConfirmDelete = useCallback(async () => {
    if (!listPendingDelete) return
    setDeleting(true)
    const result = await deleteCustomListAction(listPendingDelete.listId)
    setDeleting(false)

    if (!result.success) {
      toast({
        title: "Could not delete list",
        description: result.error ?? "Something went wrong.",
        variant: "destructive",
      })
      return
    }

    onListDeleted(listPendingDelete.listId)
    toast({
      title: "List deleted",
      description: `"${listPendingDelete.name}" was removed. Users in the list remain on the platform.`,
    })
    setListPendingDelete(null)
  }, [listPendingDelete, onListDeleted, toast])

  return (
    <div className="space-y-4">
      <CreateCustomListDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={onListCreated}
      />

      <ConfirmActionDialog
        open={listPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setListPendingDelete(null)
        }}
        title={`Delete "${listPendingDelete?.name ?? ""}"?`}
        description="This removes the list and its membership entries. The users themselves remain on the platform and in any other lists they belong to."
        confirmLabel="Delete list"
        cancelLabel="Cancel"
        variant="destructive"
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
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
            <div
              key={list.listId}
              className="group flex items-center gap-2 rounded-lg border border-border bg-card p-2 pr-3 transition-colors hover:bg-muted"
            >
              <button
                type="button"
                onClick={() => onSelect(list.listId)}
                className="flex flex-1 min-w-0 items-center gap-3 rounded-md p-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Delete list ${list.name}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setListPendingDelete(list)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
