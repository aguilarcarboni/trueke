"use client"

import { Shield, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function ViewSwitcher({ currentView }: { currentView: "user" | "admin" }) {
  if (currentView === "admin") {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Link href="/user">
          <Button variant="outline" className="gap-2 shadow-lg">
            <User className="h-4 w-4" />
            Switch to User View
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Link href="/admin">
        <Button variant="outline" className="gap-2 shadow-lg">
          <Shield className="h-4 w-4" />
          Switch to Admin View
        </Button>
      </Link>
    </div>
  )
}
