"use client"

import { useState, useEffect } from "react"
import { Item, ItemCondition, ItemType, ItemState, User } from "@/lib/data"
import { Plus, Trash2, Edit, Eye, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateItem } from "@/app/items/actions"

const dummyImages = [
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1539375665275-f9de415ef9ac?w=400&h=300&fit=crop",
  "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&h=300&fit=crop",
]

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

const itemTypes = ["physical", "digital"]
const itemStatuses: string[] = ["draft", "active", "traded", "contested"]

export function MyItems({ userItems, onCreateItem }: MyItemsProps) {

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [myItems, setMyItems] = useState<Item[]>(userItems || [])
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [viewingItem, setViewingItem] = useState<Item | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editFormData, setEditFormData] = useState({
    title: "",
    type: "physical" as ItemType,
    state: "draft" as ItemState,
    category: "",
    condition: "new" as ItemCondition,
    description: "",
    imagePreviews: [] as string[],
  })

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
    setEditFormData({
      title: item.title,
      type: item.type,
      state: item.state,
      category: item.category,
      condition: item.condition,
      description: item.description || "",
      imagePreviews: item.images || [],
    })
    setIsEditDialogOpen(true)
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setEditFormData((prev) => ({
          ...prev,
          imagePreviews: [...prev.imagePreviews, reader.result as string],
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const handleRemoveImage = (index: number) => {
    setEditFormData((prev) => ({
      ...prev,
      imagePreviews: prev.imagePreviews.filter((_, i) => i !== index),
    }))
  }

  const handleSaveEdit = async () => {
    if (!editingItem) return

    setIsUpdating(true)
    setUpdateMessage(null)

    try {
      const result = await updateItem(editingItem.id, {
        title: editFormData.title,
        type: editFormData.type,
        state: editFormData.state,
        category: editFormData.category,
        condition: editFormData.condition,
        description: editFormData.description,
      })

      if (result.error) {
        setUpdateMessage({ type: 'error', text: result.error })
      } else {
        // Update the item in the local state
        setMyItems(prevItems =>
          prevItems.map(item =>
            item.id === editingItem.id
              ? {
                  ...item,
                  title: editFormData.title,
                  type: editFormData.type,
                  state: editFormData.state,
                  category: editFormData.category,
                  condition: editFormData.condition,
                  description: editFormData.description,
                  images: editFormData.imagePreviews,
                }
              : item
          )
        )

        setUpdateMessage({ type: 'success', text: 'Item updated successfully!' })
        setIsEditDialogOpen(false)
        setEditingItem(null)
        // Clear message after 3 seconds
        setTimeout(() => setUpdateMessage(null), 3000)
      }
    } catch (error) {
      setUpdateMessage({ type: 'error', text: 'Failed to update item. Please try again.' })
      console.error('Error saving item:', error)
    } finally {
      setIsUpdating(false)
    }
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
                      {/* <img src={firstImage} alt={item.title} className="h-full w-full object-cover" /> */}
                    <img src={dummyImages[0]} alt={item.title} className="h-full w-full object-cover" />
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
                    {/* <img src={firstImage} alt={item.title} className="h-16 w-16 rounded object-cover flex-shrink-0" /> */}
                    <img src={dummyImages[0]} alt={item.title} className="h-16 w-16 rounded object-cover flex-shrink-0" />
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
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Item Details</DialogTitle>
          </DialogHeader>

          {viewingItem && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Item Image */}
              {/* {viewingItem.images && viewingItem.images.length > 0 && (
                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="w-full h-48 rounded-lg bg-muted overflow-hidden">
                    <img src={viewingItem.images[0]} alt={viewingItem.title} className="w-full h-full object-cover" />
                  </div>
                </div>
              )} */}
              <div className="space-y-2">
                <Label>Image</Label>
                <div className="w-full h-48 rounded-lg bg-muted overflow-hidden">
                  <img src={dummyImages[0]} alt={viewingItem.title} className="w-full h-full object-cover" />
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <Label className="text-muted-foreground">Title</Label>
                <p className="text-foreground font-medium">{viewingItem.title}</p>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-foreground text-sm whitespace-pre-wrap">{viewingItem.description || "No description"}</p>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <Label className="text-muted-foreground">Category</Label>
                <p className="text-foreground">{viewingItem.category}</p>
              </div>

              {/* Type */}
              <div className="space-y-1">
                <Label className="text-muted-foreground">Type</Label>
                <p className="text-foreground capitalize">{viewingItem.type}</p>
              </div>

              {/* Condition */}
              <div className="space-y-1">
                <Label className="text-muted-foreground">Condition</Label>
                <div>
                  <Badge variant="secondary">{conditionLabel[viewingItem.condition]}</Badge>
                </div>
              </div>

              {/* State/Status */}
              <div className="space-y-1">
                <Label className="text-muted-foreground">Status</Label>
                <div>
                  <Badge className={statusColors[viewingItem.state] || ""}>
                    {viewingItem.state.charAt(0).toUpperCase() + viewingItem.state.slice(1)}
                  </Badge>
                </div>
              </div>

              {/* Created Date */}
              <div className="space-y-1">
                <Label className="text-muted-foreground">Created</Label>
                <p className="text-foreground text-sm">{new Date(viewingItem.createdAt).toLocaleDateString()}</p>
              </div>


              {/* Additional Images */}
              {/* {viewingItem.images && viewingItem.images.length > 1 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">All Images</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingItem.images.map((url, index) => (
                      <div key={index} className="w-full h-20 rounded-lg bg-muted overflow-hidden">
                        <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">All Images ({viewingItem.images?.length || 0})</Label>
                <div className="grid grid-cols-3 gap-2">
                  {dummyImages.slice(0, viewingItem.images?.length || 0).map((url, index) => (
                    <div key={index} className="w-full h-20 rounded-lg bg-muted overflow-hidden">
                      <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              {/* Image Preview and Upload */}
              <div className="space-y-2">
                <Label>Item Images</Label>
                <div className="space-y-3">
                  {/* Image Previews Grid */}
                  {/* {editFormData.imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {editFormData.imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="w-full h-20 rounded-lg bg-muted overflow-hidden">
                            <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                          >
                            <X className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )} */}
                  <div className="grid grid-cols-3 gap-2">
                    {dummyImages.slice(0, editFormData.imagePreviews.length).map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="w-full h-20 rounded-lg bg-muted overflow-hidden">
                          <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                        >
                          <X className="h-5 w-5 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Upload Input */}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <Button variant="outline" type="button" asChild>
                      <span>Add Images</span>
                    </Button>
                  </Label>
                </div>
              </div>

              {/* Item Title/Name */}
              <div className="space-y-2">
                <Label htmlFor="item-title">Item Name</Label>
                <Input
                  id="item-title"
                  value={editFormData.title}
                  onChange={(e) => handleEditFormChange("title", e.target.value)}
                  placeholder="Enter item name"
                />
              </div>

              {/* Item Type */}
              <div className="space-y-2">
                <Label htmlFor="item-type">Type</Label>
                <Select value={editFormData.type} onValueChange={(value) => handleEditFormChange("type", value)}>
                  <SelectTrigger id="item-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Item Status */}
              <div className="space-y-2">
                <Label htmlFor="item-status">Status</Label>
                <Select value={editFormData.state} onValueChange={(value) => handleEditFormChange("state", value)}>
                  <SelectTrigger id="item-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {itemStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Item Category */}
              <div className="space-y-2">
                <Label htmlFor="item-category">Category</Label>
                <Input
                  id="item-category"
                  value={editFormData.category}
                  onChange={(e) => handleEditFormChange("category", e.target.value)}
                  placeholder="Enter item category"
                />
              </div>

              {/* Item Condition */}
              <div className="space-y-2">
                <Label htmlFor="item-condition">Condition</Label>
                <Select value={editFormData.condition} onValueChange={(value) => handleEditFormChange("condition", value)}>
                  <SelectTrigger id="item-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(conditionLabel).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Item Description */}
              <div className="space-y-2">
                <Label htmlFor="item-description">Description</Label>
                <textarea
                  id="item-description"
                  value={editFormData.description}
                  onChange={(e) => handleEditFormChange("description", e.target.value)}
                  placeholder="Enter item description"
                  className="w-full min-h-24 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {updateMessage && (
              <div className={`text-sm py-2 px-3 rounded ${
                updateMessage.type === 'success' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {updateMessage.text}
              </div>
            )}
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
