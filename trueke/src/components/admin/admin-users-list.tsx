"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getAdminUsers, banUser } from "@/app/actions/admin"
import { BanUserDialog } from "./ban-user-dialog"
import { useToast } from "@/hooks/use-toast"

type AdminUser = { user_id: string; username: string; status: string }

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  banned: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
}

export function AdminUsersList() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null)
  const { toast } = useToast()

  async function loadUsers() {
    setLoading(true)
    setError(null)
    const result = await getAdminUsers()
    if (result.error) {
      setError(result.error)
    } else {
      setUsers(result.data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>All Users</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={loadUsers} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="text-destructive text-sm">{error}</p>
        ) : users.length === 0 ? (
          <p className="text-muted-foreground text-sm">No users found.</p>
        ) : (
          <div className="divide-y">
            {users.map((user) => (
              <div key={user.user_id} className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">{user.username}</span>
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_STYLES[user.status] ?? ""}>
                    {user.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => router.push(`/admin/users/${user.user_id}`)}>View</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setBanTarget(user)}>Ban</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {banTarget && (
        <BanUserDialog
          username={banTarget.username}
          open={!!banTarget}
          onOpenChange={(open) => { if (!open) setBanTarget(null) }}
          onConfirm={async (duration, expiresAt, reason) => {
            const isPermanent = duration === 'permanent'
            const result = await banUser(banTarget.user_id, isPermanent ? null : expiresAt, reason)
            if (result?.error) {
              toast({ variant: 'destructive', title: 'Error', description: result.error })
            } else {
              toast({ title: 'User banned', description: `${banTarget.username} has been banned.` })
              setBanTarget(null)
              loadUsers()
            }
          }}
        />
      )}
    </Card>
  )
}
