"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { Dashboard } from "@/components/sections/dashboard"
import { Marketplace } from "@/components/sections/marketplace"
import { MyItems } from "@/components/sections/my-items"
import { CreateItem } from "@/components/sections/create-item"
import { ItemDetail } from "@/components/sections/item-detail"
import { Exchanges } from "@/components/sections/exchanges"
import { Auctions } from "@/components/sections/auctions"
import { Messages } from "@/components/sections/messages"
import { Favorites } from "@/components/sections/favorites"
import { Profile } from "@/components/sections/profile"
import { Admin } from "@/components/sections/admin"
import type { Item } from "@/lib/data"

export default function Home() {
  const router = useRouter()

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setSelectedItem(null)
  }

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item)
    setActiveSection("item-detail")
  }

  const handleBackToMyItems = () => {
    setSelectedItem(null)
    setActiveSection("my-items")
  }

  const renderSection = () => {
    if (activeSection === "item-detail" && selectedItem) {
      return <ItemDetail item={selectedItem} onBack={handleBackToMyItems} />
    }

    switch (activeSection) {
      case "dashboard":
        return <Dashboard onNavigate={handleSectionChange} />
      case "marketplace":
        return <Marketplace onSelectItem={handleSelectItem} />
      case "my-items":
        return <MyItems onSelectItem={handleSelectItem} onCreateItem={() => handleSectionChange("create-item")} />
      case "create-item":
        return <CreateItem onBack={handleBackToMyItems} />
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
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to user interface...</p>
      </div>
    </div>
  )
}

