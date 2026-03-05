"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { Dashboard } from "@/components/sections/dashboard"
import { Marketplace } from "@/components/sections/marketplace"
import { ItemDetail } from "@/components/sections/item-detail"
import { Exchanges } from "@/components/sections/exchanges"
import { Auctions } from "@/components/sections/auctions"
import { Messages } from "@/components/sections/messages"
import { Favorites } from "@/components/sections/favorites"
import { Profile } from "@/components/sections/profile"
import { ViewSwitcher } from "@/components/view-switcher"
import type { Item } from "@/lib/types"
import type { UserProfile } from "@/utils/supabase/tables/profile"

interface UserPageClientProps {
  user: {
    id: string
    email?: string
    name?: string
    avatar?: string
  }
  profile: UserProfile | null
}

export function UserPageClient({ user, profile }: UserPageClientProps) {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return null
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setSelectedItem(null)
  }

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item)
    setActiveSection("item-detail")
  }

  const handleBackToMarketplace = () => {
    setSelectedItem(null)
    setActiveSection("marketplace")
  }

  const renderSection = () => {
    if (activeSection === "item-detail" && selectedItem) {
      return <ItemDetail item={selectedItem} onBack={handleBackToMarketplace} currentUserId={user.id} />
    }

    switch (activeSection) {
      case "dashboard":
        return <Dashboard onNavigate={handleSectionChange} />
      case "marketplace":
        return <Marketplace onSelectItem={handleSelectItem} />
      case "exchanges":
        return <Exchanges currentUserId={user.id} />
      case "auctions":
        return <Auctions />
      case "messages":
        return <Messages />
      case "favorites":
        return <Favorites />
      case "profile":
        return <Profile profile={profile} />
      default:
        return <Dashboard onNavigate={handleSectionChange} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar activeSection={activeSection} onSectionChange={handleSectionChange} profile={profile} />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <MobileHeader
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          profile={profile}
        />
        <main className="p-4 lg:p-8">
          {renderSection()}
        </main>
      </div>

      {/* View Switcher for Demo */}
      <ViewSwitcher currentView="user" />
    </div>
  )
}
