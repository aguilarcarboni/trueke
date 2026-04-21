"use client"

import { Star, UserX } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { UserListMember } from "@/lib/entities/user-list"

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function UserListMembersSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────

export function UserListEmpty({ listName }: { listName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <UserX className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">No users in {listName} yet</p>
      <p className="text-xs text-muted-foreground max-w-xs">
        Add users to this list to keep track of the people you interact with.
      </p>
    </div>
  )
}

// ─── Single member card ───────────────────────────────────────────────────────

interface UserListMemberCardProps {
  member: UserListMember
  onRemove?: (userId: string) => void
  removing?: boolean
}

function UserListMemberCard({ member, onRemove, removing }: UserListMemberCardProps) {
  const initials = `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase()
  const fullName = `${member.firstName} ${member.lastName}`.trim()

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="pt-5 pb-4 flex items-center gap-3">
        <Avatar className="h-11 w-11 shrink-0">
          <AvatarImage src={member.profilePictureUrl || undefined} alt={member.username} />
          <AvatarFallback>{initials || "?"}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-card-foreground truncate">{fullName || member.username}</p>
          <p className="text-xs text-muted-foreground truncate">@{member.username}</p>

          {/* Rating row */}
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-3 w-3 ${
                  s <= Math.round(member.averageRating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-0.5">
              {member.totalReviews > 0
                ? `${member.averageRating.toFixed(1)} (${member.totalReviews})`
                : "No reviews"}
            </span>
          </div>
        </div>

        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            disabled={removing}
            onClick={() => onRemove(member.userId)}
            aria-label={`Remove ${member.username} from list`}
          >
            <UserX className="h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Members grid ─────────────────────────────────────────────────────────────

interface UserListMembersProps {
  members: UserListMember[]
  listName: string
  onRemove?: (userId: string) => void
  removingUserId?: string | null
}

export function UserListMembers({
  members,
  listName,
  onRemove,
  removingUserId,
}: UserListMembersProps) {
  if (members.length === 0) {
    return <UserListEmpty listName={listName} />
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <UserListMemberCard
          key={member.userId}
          member={member}
          onRemove={onRemove}
          removing={removingUserId === member.userId}
        />
      ))}
    </div>
  )
}
