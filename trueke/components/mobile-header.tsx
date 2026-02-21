"use client"

import { Menu, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { notifications } from "@/lib/data"
import { AppSidebar } from "./app-sidebar"

interface MobileHeaderProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function MobileHeader({ activeSection, onSectionChange }: MobileHeaderProps) {
  const unread = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <AppSidebar activeSection={activeSection} onSectionChange={onSectionChange} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-sm">
            T
          </div>
          <span className="text-lg font-bold text-foreground">Trueke</span>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
            {unread}
          </span>
        )}
      </Button>
    </header>
  )
}
