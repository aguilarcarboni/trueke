"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ItemWithAddress, ITEM_CONDITION_LABELS } from "@/lib/entities/item"
import type { ItemCondition } from "@/lib/entities/item"
import { Plus, Trash2, Edit, Eye, Package, Search, Grid3X3, List, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EditItemDialog } from "@/components/sections/items/edit-item-dialog"
import { Title } from "@radix-ui/react-toast"
import { City, State, Country } from "country-state-city"

// Placeholder component for items without images
function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-muted ${className}`}>
      <Package className="h-12 w-12 text-muted-foreground" />
    </div>
  )
}

interface MyItemsProps {
  userItems: ItemWithAddress[] | null
  onSelectItem?: (item: ItemWithAddress) => void
  onCreateItem?: () => void
}

const conditionLabel: Record<string, string> = {
  "new": "New",
  "like new": "Like New",
  "used": "Used",
  "heavily used": "Heavily Used",
  "broken": "Broken",
}

const statusColors: Record<string, string> = {
  active: "bg-success/20 text-success",
  draft: "bg-muted/20 text-muted-foreground",
  traded: "bg-accent/20 text-accent-foreground",
  contested: "bg-warning/20 text-warning-foreground"
}

export function MyItems({ userItems, onCreateItem }: MyItemsProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [myItems, setMyItems] = useState<ItemWithAddress[]>(userItems || [])
  const [editingItem, setEditingItem] = useState<ItemWithAddress | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedCondition, setSelectedCondition] = useState<ItemCondition | "">("")
  const [selectedStatus, setSelectedStatus] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("")
  const [selectedCity, setSelectedCity] = useState("")

  // Sync myItems when userItems prop changes
  useEffect(() => {
    if (userItems) {
      setMyItems(userItems)
    }
  }, [userItems])

  const categories = useMemo(
    () => Array.from(new Set(myItems.map((i) => i.category).filter(Boolean))).sort(),
    [myItems]
  )

  const countries = useMemo(
    () => Array.from(new Set(myItems.map((i) => i.address?.countryCode).filter(Boolean) as string[])).sort(),
    [myItems]
  )

  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          myItems
            .filter((i) => !selectedCountry || i.address?.countryCode === selectedCountry)
            .map((i) => i.address?.city)
            .filter(Boolean) as string[]
        )
      ).sort(),
    [myItems, selectedCountry]
  )

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return myItems.filter((item) => {
      if (q && !item.title.toLowerCase().includes(q) && !(item.description ?? "").toLowerCase().includes(q)) return false
      if (selectedCategory && item.category !== selectedCategory) return false
      if (selectedCondition && item.condition !== selectedCondition) return false
      if (selectedStatus && item.status !== selectedStatus) return false
      if (selectedCountry && item.address?.countryCode !== selectedCountry) return false
      if (selectedCity && item.address?.city !== selectedCity) return false
      return true
    })
  }, [myItems, searchQuery, selectedCategory, selectedCondition, selectedStatus, selectedCountry, selectedCity])

  const hasActiveFilters = searchQuery !== "" || selectedCategory !== "" || selectedCondition !== "" || selectedStatus !== "" || selectedCountry !== "" || selectedCity !== ""

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("")
    setSelectedCondition("")
    setSelectedStatus("")
    setSelectedCountry("")
    setSelectedCity("")
  }

  const handleDeleteItem = (itemId: string) => {
    console.log("Deleting item:", itemId)
  }

  const handleViewClick = (item: ItemWithAddress) => {
    router.push(`/items/${encodeURIComponent(item.item_id)}`)
  }

  const handleEditClick = (item: ItemWithAddress) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  const handleItemUpdated = (updatedItem: ItemWithAddress) => {
    setMyItems(prevItems =>
      prevItems.map(item =>
        item.item_id === updatedItem.item_id ? updatedItem : item
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Items</h1>
          <p className="text-muted-foreground mt-1">Manage your items available for trade.</p>
        </div>
        <Button className="gap-2" onClick={onCreateItem}>
          <Plus className="h-4 w-4" />
          Add New Item
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myItems.filter((i) => i.status === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Traded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myItems.filter((i) => i.status === "traded").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          {/* Row 1: Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Row 2: Filters */}
          <div className="flex gap-3 items-center">
            <Select value={selectedCategory || "__all__"} onValueChange={(v) => setSelectedCategory(v === "__all__" ? "" : v)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCondition || "__all__"} onValueChange={(v) => setSelectedCondition(v === "__all__" ? "" : v as ItemCondition)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All conditions</SelectItem>
                {(Object.entries(ITEM_CONDITION_LABELS) as [ItemCondition, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus || "__all__"} onValueChange={(v) => setSelectedStatus(v === "__all__" ? "" : v)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="traded">Traded</SelectItem>
                <SelectItem value="contested">Contested</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={selectedCountry || "__all__"}
              onValueChange={(v) => {
                setSelectedCountry(v === "__all__" ? "" : v)
                setSelectedCity("")
              }}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All countries</SelectItem>
                {countries.map((code) => (
                  <SelectItem key={code} value={code}>
                    {Country.getCountryByCode(code)?.name ?? code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCity || "__all__"} onValueChange={(v) => setSelectedCity(v === "__all__" ? "" : v)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex rounded-lg border border-border shrink-0 ml-auto">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-r-none" onClick={() => setViewMode("grid")}>
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-9 w-9 rounded-l-none" onClick={() => setViewMode("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1.5 text-muted-foreground shrink-0">
                <X className="h-3.5 w-3.5" />
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">
        {filteredItems.length === myItems.length ? `${myItems.length} items` : `${filteredItems.length} of ${myItems.length} items`}
      </p>

      {/* Items Grid/List */}
      {myItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">No items yet</p>
              <p className="text-muted-foreground mb-6">Start by adding your first item to the marketplace.</p>
              <Button variant="outline" onClick={onCreateItem}>
                Add Your First Item
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground mb-2">No items match your filters</p>
              <p className="text-muted-foreground mb-6">Try adjusting or clearing your search criteria.</p>
              <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
          {filteredItems.map((item) => {
            // const firstImage = item.images && item.images.length > 0 ? item.images[0] : "/placeholder-image.png"
            // const mockImages = ["/api/placeholder/400/300", "/api/placeholder/400/301", "/api/placeholder/400/302"]
            // const firstImage = mockImages[Math.floor(Math.random() * mockImages.length)]
            return (
            <Card key={item.item_id}>
              <CardContent className="p-0">
                {viewMode === "grid" ? (
                  <div className="flex flex-col">
                    {/* Image */}
                    <div className="relative w-full overflow-hidden rounded-t-lg bg-muted h-40">
                      {item.images && item.images.length > 0 ? (
                        <img 
                          src={item.images[0]} 
                          alt={item.title} 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <ImagePlaceholder className={`h-full w-full ${item.images && item.images.length > 0 ? 'hidden' : ''}`} />
                      <div className="absolute top-2 right-2 flex gap-2">
                        {item.images && item.images.length > 1 && (
                          <Badge variant="secondary" className="text-xs">{item.images.length} images</Badge>
                        )}
                        <Badge className={statusColors[item.status] || ""}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-4">
                      {/* Title and category */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                        </div>
                      </div>
                      {/* Condition badge */}
                      <Badge variant="secondary" className="mb-3">
                        {conditionLabel[item.condition]}
                      </Badge>
                      {/* Item Address (if available) */}
                      <div className="flex flex-col items-start">
                        {item.address && (
                          <p className="text-xs text-muted-foreground mb-4">
                            {item.address.city}, {item.address.province}, {Country.getCountryByCode(item.address.countryCode)?.name}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{item.description || "No description"}</p>
                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => handleViewClick(item)}>
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => handleEditClick(item)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => handleDeleteItem(item.item_id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    <div className="h-16 w-16 rounded overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <img 
                          src={item.images[0]} 
                          alt={item.title} 
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                      ) : null}
                      <ImagePlaceholder className={`h-full w-full ${item.images && item.images.length > 0 ? 'hidden' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                        <Badge className={statusColors[item.status] || ""}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.category} • {conditionLabel[item.condition]}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.description || "No description"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleViewClick(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditClick(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDeleteItem(item.item_id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}

      {/* Edit Item Dialog */}
      <EditItemDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        item={editingItem}
        onItemUpdated={handleItemUpdated}
      />
    </div>
  )
}
