"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { Dashboard } from "@/components/sections/dashboard"
import { Marketplace } from "@/components/sections/marketplace"
import { MyItems } from "@/components/sections/my-items"
import { ItemDetail } from "@/components/sections/item-detail"
import { Exchanges } from "@/components/sections/exchanges"
import { Auctions } from "@/components/sections/auctions"
import { Messages } from "@/components/sections/messages"
import { Favorites } from "@/components/sections/favorites"
import { Profile } from "@/components/sections/profile"
import { Admin } from "@/components/sections/admin"
import type { Item } from "@/lib/data"

export default function Home() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

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
      return <ItemDetail item={selectedItem} onBack={handleBackToMarketplace} />
    }

    switch (activeSection) {
      case "dashboard":
        return <Dashboard onNavigate={handleSectionChange} />
      case "marketplace":
        return <Marketplace onSelectItem={handleSelectItem} />
      case "my-items":
        return <MyItems onSelectItem={handleSelectItem} />
      case "exchanges":
        return <Exchanges />
      case "auctions":
        return <Auctions />
      case "messages":
        return <Messages />
      case "favorites":
        return <Favorites />
      case "profile":
        return <Profile />
      case "admin":
        return <Admin />
      default:
        return <Dashboard onNavigate={handleSectionChange} />
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <AppSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <MobileHeader activeSection={activeSection} onSectionChange={handleSectionChange} />
        <main className="p-4 lg:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}
