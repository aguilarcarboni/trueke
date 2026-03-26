'use client'

import { Bell, CheckCheck, Repeat, MessageSquare, CalendarCheck, Star, AlertTriangle, Info, ExternalLink, UserPlus, XCircle } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useNotifications } from '@/hooks/use-notifications'
import {
  formatNotificationTime,
  NOTIFICATION_TYPE_COLORS,
  type NotificationType,
} from '@/lib/entities/notification'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// ─── Icon mapping per notification type ──────────────────────────────────────

const NOTIFICATION_ICONS: Partial<Record<NotificationType, React.ElementType>> = {
  account_created: UserPlus,
  proposal_created: Repeat,
  proposal_accepted: Repeat,
  proposal_rejected: Repeat,
  proposal_cancelled: XCircle,
  counter_offer: Repeat,
  message_received: MessageSquare,
  meeting_invite: CalendarCheck,
  meeting_rsvp: CalendarCheck,
  rating_received: Star,
  item_reported: AlertTriangle,
  user_reported: AlertTriangle,
  system: Info,
}

function getIcon(type: NotificationType) {
  return NOTIFICATION_ICONS[type] ?? Info
}

// ─── Deep-link routes by reference_type ──────────────────────────────────────

function getDeepLink(referenceType: string | null): string | null {
  if (!referenceType) return null
  const routes: Record<string, string> = {
    exchange: '/exchanges',
    message: '/messages',
    meeting: '/exchanges', // meetings are exchange-related for now
    item: '/items',
    user: '/profile',
  }
  return routes[referenceType] ?? null
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * Bell icon with unread badge + popover listing all notifications.
 *
 * AC6: Each notification shows title, description, and time.
 * AC7: Dedicated notifications area (popover).
 * AC8: Unread notifications clearly indicated (dot + bold + badge count).
 */
export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      fetchNotifications()
    }
  }

  /** Mark a notification as read (keeps popover open). */
  const handleClick = async (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      await markAsRead(notificationId)
    }
  }

  /** Navigate to the related page (closes popover). */
  const handleNavigate = (e: React.MouseEvent, referenceType: string | null) => {
    e.stopPropagation()
    const route = getDeepLink(referenceType)
    if (route) {
      setOpen(false)
      router.push(route)
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative rounded-md p-2 transition-colors hover:bg-muted"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-96 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto gap-1.5 px-2 py-1 text-xs text-muted-foreground"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="h-[420px]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Bell className="h-8 w-8" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((n, i) => {
                const Icon = getIcon(n.type)
                const colorClass = NOTIFICATION_TYPE_COLORS[n.type] ?? 'text-muted-foreground'

                return (
                  <div key={n.notification_id}>
                    <button
                      onClick={() => handleClick(n.notification_id, n.is_read)}
                      className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                        !n.is_read ? 'bg-primary/5' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className={`mt-0.5 shrink-0 ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>

                      {/* Content (AC6) */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm leading-tight ${!n.is_read ? 'font-semibold' : 'font-medium'}`}>
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {n.body}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          {formatNotificationTime(n.created_at)}
                        </p>
                      </div>

                      {/* Navigate link (if applicable) */}
                      {getDeepLink(n.reference_type) && (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleNavigate(e, n.reference_type)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleNavigate(e as unknown as React.MouseEvent, n.reference_type) }}
                          className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                          title="Go to page"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      )}

                      {/* Unread dot (AC8) */}
                      {!n.is_read && (
                        <div className="mt-1.5 shrink-0">
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        </div>
                      )}
                    </button>
                    {i < notifications.length - 1 && <Separator />}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
