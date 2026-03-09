"use client"

import { useState, useEffect } from "react"
import { Item } from "@/lib/data"
import { Plus, Trash2, Edit, Eye, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ViewItemDialog } from "@/components/view-item-dialog"
import { EditItemDialog } from "@/components/edit-item-dialog"
import { items } from "@/lib/data"
import { getConditionLabel, getStatusLabel, getStatusStyle } from "@/lib/item-constants"
import type { Item } from "@/lib/data"

// Placeholder component for items without images
function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-muted ${className}`}>
      <Package className="h-12 w-12 text-muted-foreground" />
    </div>
  )
}

interface MyItemsProps {
  userItems: Item[] | null
  onSelectItem?: (item: Item) => void
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

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [myItems, setMyItems] = useState<Item[]>(userItems || [])
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [viewingItem, setViewingItem] = useState<Item | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  // Sync myItems when userItems prop changes
  useEffect(() => {
    if (userItems) {
      setMyItems(userItems)
    }
  }, [userItems])

  const handleDeleteItem = (itemId: string) => {
    console.log("Deleting item:", itemId)
  }

  const handleViewClick = (item: Item) => {
    setViewingItem(item)
    setIsViewDialogOpen(true)
  }

  const handleEditClick = (item: Item) => {
    setEditingItem(item)
    setIsEditDialogOpen(true)
  }

  const handleItemUpdated = (updatedItem: Item) => {
    setMyItems(prevItems =>
      prevItems.map(item =>
        item.id === updatedItem.id ? updatedItem : item
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
            <div className="text-2xl font-bold">{myItems.filter((i) => i.state === "active").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Traded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myItems.filter((i) => i.state === "traded").length}</div>
          </CardContent>
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
          {myItems.map((item) => {
            // const firstImage = item.images && item.images.length > 0 ? item.images[0] : "/placeholder-image.png"
            // const mockImages = ["/api/placeholder/400/300", "/api/placeholder/400/301", "/api/placeholder/400/302"]
            // const firstImage = mockImages[Math.floor(Math.random() * mockImages.length)]
            return (
            <Card key={item.id}>
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
                        <Badge className={statusColors[item.state] || ""}>
                          {item.state.charAt(0).toUpperCase() + item.state.slice(1)}
                        </Badge>
                      </div>
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
                        {conditionLabel[item.condition]}
                      </Badge>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{item.description || "No description"}</p>
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
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4">
                    <div className="h-16 w-16 rounded overflow-hidden flex-shrink-0">
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
                        <Badge className={statusColors[item.state] || ""}>
                          {item.state.charAt(0).toUpperCase() + item.state.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {item.category} • {conditionLabel[item.condition]}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.description || "No description"}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleViewClick(item)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEditClick(item)}>
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
            )
          })}
        </div>
      )}

      {/* View Item Dialog */}
      <ViewItemDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        item={viewingItem}
      />

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
