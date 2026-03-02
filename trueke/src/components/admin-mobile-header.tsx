"use client"

import { Menu, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { AdminSidebar } from "./admin-sidebar"

interface AdminMobileHeaderProps {
  user: {
    id: string
    email?: string
    name?: string
    avatar?: string
  }
}

export function AdminMobileHeader({ user }: AdminMobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex lg:hidden items-center justify-between border-b border-border bg-card px-4 py-3">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AdminSidebar user={user} />
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <span className="font-semibold">Admin</span>
      </div>
    </header>
  )
}
