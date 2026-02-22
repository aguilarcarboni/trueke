"use client"

import { useState } from "react"
import { Plus, Trash2, Edit, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { items } from "@/lib/data"
import type { Item } from "@/lib/data"

interface MyItemsProps {
  onSelectItem?: (item: Item) => void
  onCreateItem?: () => void
}

const conditionLabel: Record<string, string> = {
  "like-new": "Like New",
  good: "Good",
  fair: "Fair",
  worn: "Worn",
  bad: "Bad",
}

const stateColors: Record<string, string> = {
  active: "bg-success/20 text-success",
  inactive: "bg-muted/20 text-muted-foreground",
  traded: "bg-accent/20 text-accent-foreground",
  pending: "bg-warning/20 text-warning-foreground",
}

export function MyItems({ onSelectItem, onCreateItem }: MyItemsProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Filter items to show only user's items (for demo, show first 3 items as user's)
  const myItems = items.slice(0, 3)

  const handleDeleteItem = (itemId: string) => {
    console.log("Deleting item:", itemId)
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
            <div className="text-2xl font-bold">{myItems.filter((i) => i.state === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Traded</CardTitle>
          </CardHeader>
        </Card>
      </div>

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
      ) : (
        <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-3"}>
          {myItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-0">
                {viewMode === "grid" ? (
                  <div className="flex flex-col">
                    {/* Image */}
                    <div className="relative w-full overflow-hidden rounded-t-lg bg-muted h-40">
                      <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                      <Badge className={`absolute top-2 right-2 ${stateColors[item.state] || ""}`}>
                        {item.state.charAt(0).toUpperCase() + item.state.slice(1)}
                      </Badge>
                    </div>
                    {/* Content */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{item.category}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="mb-3">
                        {conditionLabel[item.condition] || item.condition}
                      </Badge>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{item.description}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1 gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 gap-1">
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    <img src={item.images[0]} alt={item.title} className="h-16 w-16 rounded object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">{item.title}</h3>
                        <Badge className={stateColors[item.state] || ""}>
                          {item.state.charAt(0).toUpperCase() + item.state.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.category} • {conditionLabel[item.condition] || item.condition}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDeleteItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
