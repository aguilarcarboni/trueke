"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, Grid3X3, List } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { items, categories } from "@/lib/data"
import type { Item } from "@/lib/data"

interface MarketplaceProps {
  onSelectItem: (item: Item) => void
}

const conditionLabel: Record<string, string> = {
  "like-new": "Like New",
  good: "Good",
  fair: "Fair",
  worn: "Worn",
  bad: "Bad",
}

export function Marketplace({ onSelectItem }: MarketplaceProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const filtered = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory
    return matchesSearch && matchesCategory && item.state === "active"
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        <p className="text-muted-foreground mt-1">Browse and discover items available for trade.</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search items, categories, users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
              <div className="flex rounded-lg border border-border">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{filtered.length} items found</p>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectItem(item)}
              className="group cursor-pointer overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  crossOrigin="anonymous"
                />
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <Badge className="bg-card/90 text-card-foreground backdrop-blur-sm text-xs">
                    {item.category}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-card/90 text-card-foreground backdrop-blur-sm capitalize text-xs border-0">
                    {item.type}
                  </Badge>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-card-foreground truncate">{item.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={item.owner.avatar} alt={item.owner.name} />
                      <AvatarFallback className="text-[10px]">{item.owner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{item.owner.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {conditionLabel[item.condition]}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card
              key={item.id}
              className="cursor-pointer transition-all hover:shadow-md"
              onClick={() => onSelectItem(item)}
            >
              <CardContent className="flex gap-4 py-4">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="h-24 w-24 rounded-lg object-cover shrink-0"
                  crossOrigin="anonymous"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-card-foreground">{item.title}</h3>
                    <div className="flex gap-1.5 shrink-0">
                      <Badge variant="secondary" className="capitalize text-xs">{item.type}</Badge>
                      <Badge variant="outline" className="capitalize text-xs">{conditionLabel[item.condition]}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={item.owner.avatar} alt={item.owner.name} />
                      <AvatarFallback className="text-[10px]">{item.owner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">{item.owner.name}</span>
                    <span className="text-xs text-muted-foreground">&middot;</span>
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
