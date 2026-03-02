"use client"

import {
  Home,
  ShoppingBag,
  ArrowLeftRight,
  Gavel,
  MessageSquare,
  Bell,
  Heart,
  Package,
  Plus,
} from "lucide-react"
import { notifications } from "@/lib/data"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { UserProfile } from "@/utils/supabase/tables/profile"

interface AppSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
  profile: UserProfile | null
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "marketplace", label: "Marketplace", icon: ShoppingBag },
  { id: "my-items", label: "My Items", icon: Package },
  { id: "create-item", label: "Create Item", icon: Plus },
  { id: "exchanges", label: "Exchanges", icon: ArrowLeftRight },
  { id: "auctions", label: "Auctions", icon: Gavel },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "favorites", label: "Favorites", icon: Heart },
]

export function AppSidebar({ activeSection, onSectionChange, profile }: AppSidebarProps) {
  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim() || profile.username
    : "—"
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
  const locationSummary = profile?.address
    ? [profile.address.city, profile.address.province, profile.address.countryCode]
        .filter(Boolean)
        .join(", ")
    : profile?.email ?? ""
  const unread = notifications.filter((n) => !n.read).length

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-lg">
          T
        </div>
        <span className="text-xl font-bold tracking-tight">Trueke</span>
      </div>

      {/* Search */}
      {/*Comment out for now, redundant
      if we already have the "Marketplace button in the 
      navegation bar"
      <div className="px-4 pb-3">
        <button
          onClick={() => onSectionChange("marketplace")}
          className="flex w-full items-center gap-2 rounded-lg bg-sidebar-accent/50 px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent"
        >
          <Search className="h-4 w-4" />
          <span>Search items...</span>
        </button>
      </div>*/}
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
                {item.id === "messages" && unread > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                    {unread}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Notifications shortcut */}
      <div className="border-t border-sidebar-border px-3 py-2">
        <button
          onClick={() => onSectionChange("dashboard")}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <Bell className="h-4.5 w-4.5" />
          <span>Notifications</span>
          {unread > 0 && (
            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-semibold">
              {unread}
            </span>
          )}
        </button>
      </div>

      {/* User */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <button
          onClick={() => onSectionChange("profile")}
          className="flex w-full items-center gap-3 rounded-lg transition-colors hover:bg-sidebar-accent px-2 py-1.5"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.profilePictureUrl || undefined} alt={displayName} />
            <AvatarFallback className="text-xs text-muted-foreground">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium leading-none truncate">{displayName}</p>
            {locationSummary && (
              <p className="text-xs text-sidebar-foreground/50 mt-0.5 truncate">{locationSummary}</p>
            )}
            {!locationSummary && profile?.username && (
              <p className="text-xs text-sidebar-foreground/50 mt-0.5 truncate">@{profile.username}</p>
            )}
          </div>
        </button>
      </div>
    </aside>
  )
}
