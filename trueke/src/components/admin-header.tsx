"use client"

import { Shield } from "lucide-react"
import { UserMenu } from "./user-menu"

interface AdminHeaderProps {
  user: {
    id: string
    email?: string
    name?: string
    avatar?: string
  } | null
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold">Admin</span>
      </div>
      <div className="flex items-center gap-2">
        <UserMenu user={user} />
      </div>
    </header>
  )
}
