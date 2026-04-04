"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Bell, CheckCheck } from "lucide-react"
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationRow,
} from "@/app/actions/notifications"

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ""
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function DashboardNotifications() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const result = await getNotifications()
    if (result.data) {
      setNotifications(result.data)
      setUnreadCount(result.unreadCount ?? 0)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleMarkRead(notificationId: string) {
    setNotifications((prev) =>
      prev.map((n) =>
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      )
    )
    setUnreadCount((c) => Math.max(0, c - 1))
    await markNotificationRead(notificationId)
  }

  async function handleMarkAll() {
    setMarkingAll(true)
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    setMarkingAll(false)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground text-base">Notifications</CardTitle>
        {!loading && (
          <Badge
            className={
              unreadCount > 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }
          >
            {unreadCount} new
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex flex-col gap-1 rounded-md p-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">No notifications yet.</p>
            </div>
          ) : (
            <>
              {notifications.map((n) => (
                <button
                  key={n.notification_id}
                  onClick={() => !n.is_read && handleMarkRead(n.notification_id)}
                  className={`w-full rounded-md p-2 text-left transition-colors hover:bg-muted ${
                    !n.is_read ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                      <div className={`min-w-0 ${n.is_read ? "pl-4" : ""}`}>
                        <p className="truncate text-sm font-medium text-foreground">
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {n.body}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(n.sent_at)}
                    </span>
                  </div>
                </button>
              ))}
              {unreadCount > 0 && (
                <div className="pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full text-xs text-muted-foreground"
                    disabled={markingAll}
                    onClick={handleMarkAll}
                  >
                    <CheckCheck className="mr-1 h-3.5 w-3.5" />
                    {markingAll ? "Marking all read…" : "Mark all as read"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
