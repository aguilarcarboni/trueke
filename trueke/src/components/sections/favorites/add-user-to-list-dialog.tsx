"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, UserPlus, Loader2, Star } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { searchUsersForListAction, addUserToListAction } from "@/app/actions/user-list"
import { useToast } from "@/hooks/use-toast"
import type { UserSearchResult } from "@/lib/entities/user-list"

// ─── Props ────────────────────────────────────────────────────────────────────

interface AddUserToListDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  listId: string
  listName: string
  /** Current member user IDs — excluded from search results. */
  existingMemberIds: string[]
  /** Called after a user is successfully added, so the parent can refresh. */
  onUserAdded: (userId: string) => void
}

// ─── Result row ───────────────────────────────────────────────────────────────

interface ResultRowProps {
  user: UserSearchResult
  adding: boolean
  added: boolean
  onAdd: (userId: string) => void
}

function ResultRow({ user, adding, added, onAdd }: ResultRowProps) {
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  const fullName = `${user.firstName} ${user.lastName}`.trim()

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={user.profilePictureUrl || undefined} alt={user.username} />
        <AvatarFallback>{initials || "?"}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{fullName || user.username}</p>
        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>

        {/* Rating row */}
        <div className="flex items-center gap-1 mt-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`h-3 w-3 ${
                s <= Math.round(user.averageRating)
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
          <span className="text-xs text-muted-foreground ml-0.5">
            {user.totalReviews > 0
              ? `${user.averageRating.toFixed(1)} (${user.totalReviews})`
              : "No reviews"}
          </span>
        </div>
      </div>

      <Button
        size="sm"
        variant={added ? "outline" : "default"}
        disabled={adding || added}
        onClick={() => onAdd(user.userId)}
        aria-label={`Add ${user.username} to list`}
        className="shrink-0 gap-1.5"
      >
        {adding ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <UserPlus className="h-3.5 w-3.5" />
        )}
        {added ? "Added" : "Add"}
      </Button>
    </div>
  )
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

export function AddUserToListDialog({
  open,
  onOpenChange,
  listId,
  listName,
  existingMemberIds,
  onUserAdded,
}: AddUserToListDialogProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [addingUserId, setAddingUserId] = useState<string | null>(null)
  const [addedUserIds, setAddedUserIds] = useState<Set<string>>(new Set())
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toast } = useToast()

  // Track member ids including ones added this session
  const effectiveExcludeIds = [...existingMemberIds, ...Array.from(addedUserIds)]

  const runSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([])
        return
      }
      setSearching(true)
      const res = await searchUsersForListAction(q, effectiveExcludeIds)
      setSearching(false)
      if (res.success && res.data) setResults(res.data)
      else setResults([])
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveExcludeIds.join(",")]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runSearch(query), 350)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, runSearch])

  function handleClose(value: boolean) {
    if (!value) {
      setQuery("")
      setResults([])
      setAddedUserIds(new Set())
    }
    onOpenChange(value)
  }

  async function handleAdd(userId: string) {
    setAddingUserId(userId)
    const res = await addUserToListAction(listId, userId)
    setAddingUserId(null)

    if (!res.success) {
      toast({ title: "Failed to add user", description: res.error ?? "Something went wrong.", variant: "destructive" })
      return
    }

    setAddedUserIds((prev) => new Set(prev).add(userId))
    // Remove from visible results immediately
    setResults((prev) => prev.filter((u) => u.userId !== userId))
    onUserAdded(userId)
    toast({ title: "User added", description: `User has been added to "${listName}".` })
    handleClose(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add User to {listName}</DialogTitle>
          <DialogDescription>
            Search by username or name and add them to this list.
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            autoFocus
            placeholder="Search by username or name…"
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Results */}
        <div className="min-h-30">
          {searching ? (
            <div className="flex items-center justify-center py-10 gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          ) : query.trim() && results.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              No users found matching or all users matching search already in list &ldquo;{query}&rdquo;
            </p>
          ) : results.length > 0 ? (
            <ScrollArea className="max-h-72">
              <div className="space-y-0.5 pr-1">
                {results.map((user) => (
                  <ResultRow
                    key={user.userId}
                    user={user}
                    adding={addingUserId === user.userId}
                    added={addedUserIds.has(user.userId)}
                    onAdd={handleAdd}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-10">
              Start typing to search for users.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
