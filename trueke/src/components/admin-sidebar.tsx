"use client"

import { useState } from "react"
import {
  Shield,
  Users,
  FileText,
  Settings,
  BarChart3,
  AlertTriangle,
  LogOut,
  Loader2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { logout } from "@/app/login/actions"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface AdminSidebarProps {
  activeSection?: string
  onSectionChange?: (section: string) => void
  user: {
    id: string
    email?: string
    name?: string
    avatar?: string
  }
}

const adminNavItems = [
  { id: "admin", label: "Reports", icon: AlertTriangle },
  { id: "admin-users", label: "User Management", icon: Users },
  { id: "admin-audit", label: "Audit Log", icon: FileText },
  { id: "admin-analytics", label: "Analytics", icon: BarChart3 },
  { id: "admin-settings", label: "Settings", icon: Settings },
]

export function AdminSidebar({ activeSection = "admin", onSectionChange, user }: AdminSidebarProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const result = await logout()
      if (result?.error) {
        toast.error(result.error)
        return
      }
      router.replace("/")
      router.refresh()
    } catch {
      toast.error("Failed to sign out. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "A"

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-lg">
          T
        </div>
        <span className="text-xl font-bold tracking-tight">Trueke</span>
      </div>

      {/* Admin Notice */}
      <div className="px-4 pb-3">
        <div className="flex items-start gap-2 rounded-lg bg-sidebar-accent/50 px-3 py-2 text-xs">
          <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sidebar-foreground">Administrator Mode</p>
            <p className="text-muted-foreground mt-0.5">
              Moderation and management tools.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3">
        <div className="space-y-1">
          {adminNavItems.map((item) => {
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSectionChange?.(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Admin User Info */}
      <div className="border-t border-sidebar-border px-4 py-4 space-y-2">
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-sidebar-accent">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name || user.email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium leading-none">{user.name || "Admin"}</p>
              <Shield className="h-3 w-3 text-primary" />
            </div>
            <p className="text-xs text-sidebar-foreground/50 mt-0.5">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-sidebar-accent transition-colors disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>{isLoggingOut ? "Signing out..." : "Log out"}</span>
        </button>
      </div>
    </aside>
  )
}
