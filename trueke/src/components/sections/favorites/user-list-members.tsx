"use client"

import { Star, UserX, MapPin, ArrowLeftRight } from "lucide-react"
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

export function UserListEmpty(_props: { listName?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <UserX className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-foreground">No users in this list yet.</p>
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
  onOpenProfile?: (userId: string) => void
}

function UserListMemberCard({ member, onRemove, removing, onOpenProfile }: UserListMemberCardProps) {
  const initials = `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase()
  const fullName = `${member.firstName} ${member.lastName}`.trim()

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="pt-5 pb-4 flex items-stretch gap-2">
        <button
          type="button"
          className="flex flex-1 min-w-0 items-start gap-3 text-left rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`View profile for @${member.username}`}
          onClick={() => onOpenProfile?.(member.userId)}
        >
          <Avatar className="h-11 w-11 shrink-0">
            <AvatarImage src={member.profilePictureUrl || undefined} alt={member.username} />
            <AvatarFallback>{initials || "?"}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-card-foreground truncate">{fullName || member.username}</p>
            <p className="text-xs text-muted-foreground truncate">@{member.username}</p>

            {member.locationLabel ? (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{member.locationLabel}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground/70">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>Location not set</span>
              </div>
            )}

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

            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <ArrowLeftRight className="h-3 w-3 shrink-0" />
              <span>
                {member.tradeCount === 1 ? "1 completed trade" : `${member.tradeCount} completed trades`}
              </span>
            </div>
          </div>
        </button>

        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive self-start"
            disabled={removing}
            onClick={(e) => {
              e.stopPropagation()
              onRemove(member.userId)
            }}
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
  onMemberClick?: (userId: string) => void
}

export function UserListMembers({
  members,
  listName,
  onRemove,
  removingUserId,
  onMemberClick,
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
          onOpenProfile={onMemberClick}
        />
      ))}
    </div>
  )
}
