"use client"

import { useState, useEffect } from "react"
import { ItemCondition, ItemType, ItemStatus, ItemWithAddress, ITEM_CONDITIONS, ITEM_CONDITION_LABELS } from "@/lib/entities/item"
import { ITEM_CATEGORIES } from "@/lib/data"
import { X, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { updateItem } from "@/app/actions/item"
import { AddressSchema, EMPTY_ADDRESS } from "@/lib/entities/address"
import { AddressForm } from "@/components/misc/address-form"

// Placeholder component for items without images
function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-muted ${className}`}>
      <Package className="h-12 w-12 text-muted-foreground" />
    </div>
  )
}

const itemTypes = ["physical", "digital"]
const itemStatuses: string[] = ["draft", "active"]

interface EditItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ItemWithAddress | null
  onItemUpdated?: (updatedItem: ItemWithAddress) => void
}

export function EditItemDialog({ open, onOpenChange, item, onItemUpdated }: EditItemDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [editFormData, setEditFormData] = useState({
    title: "",
    type: "physical" as ItemType,
    state: "draft" as ItemStatus,
    category: "",
    condition: "new" as ItemCondition,
    description: "",
    imagePreviews: [] as string[],
    address: { ...EMPTY_ADDRESS },
  })

  // Initialize form data when item changes
  useEffect(() => {
    if (item) {
      setEditFormData({
        title: item.title,
        type: item.item_type,
        state: item.status,
        category: item.category,
        condition: item.condition,
        description: item.description || "",
        imagePreviews: item.images || [],
        address: item.address ? { 
          countryCode: item.address.countryCode,
          addressLine1: item.address.addressLine1,
          addressLine2: item.address.addressLine2,
          muniDistrict: item.address.muniDistrict,
          city: item.address.city,
          province: item.address.province,
          zipCode: item.address.zipCode,
        } : { ...EMPTY_ADDRESS },
      })
      setFieldErrors({})
      setUpdateMessage(null)
    }
  }, [item])

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }))

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
    if (!item) return

    // Validate address using AddressSchema
    const addressValidation = AddressSchema.safeParse(editFormData.address)
    if (!addressValidation.success) {
      const errors: Record<string, string> = {}
      for (const err of addressValidation.error.errors) {
        const field = err.path[0] as string
        if (!errors[field]) errors[field] = err.message
      }
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    setIsUpdating(true)
    setUpdateMessage(null)

    try {
      const result = await updateItem(
        item.item_id,
        {
          title: editFormData.title,
          item_type: editFormData.type,
          status: editFormData.state,
          category: editFormData.category,
          condition: editFormData.condition,
          description: editFormData.description,
        },
        editFormData.address
      )

      if (result.error) {
        setUpdateMessage({ type: 'error', text: result.error })
        return
      }

      const updatedItem: ItemWithAddress = {
        ...item,
        title: editFormData.title,
        item_type: editFormData.type,
        status: editFormData.state,
        category: editFormData.category,
        condition: editFormData.condition,
        description: editFormData.description,
        images: editFormData.imagePreviews,
        address: {
          addressId: item.address?.addressId ?? null,
          ...editFormData.address,
        },
      }
      
      onItemUpdated?.(updatedItem)
      setUpdateMessage({ type: 'success', text: 'Item updated successfully!' })
      onOpenChange(false)
    } catch (error) {
      setUpdateMessage({ type: 'error', text: 'Failed to update item. Please try again.' })
      console.error('Error saving item:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col w-full max-w-lg max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        {item && (
          <ScrollArea className="flex-1 overflow-y-auto pr-4">
            <div className="space-y-4 py-1">
              {/* Image Preview and Upload */}
              <div className="space-y-2">
                <Label>Item Images</Label>
                <div className="space-y-3">
                  {/* Image Previews Grid */}
                  {editFormData.imagePreviews.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {editFormData.imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <div className="w-full h-20 rounded-lg bg-muted overflow-hidden">
                            <img 
                              src={preview} 
                              alt={`Preview ${index + 1}`} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                e.currentTarget.nextElementSibling?.classList.remove('hidden')
                              }}
                            />
                            <ImagePlaceholder className="w-full h-full hidden" />
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
                  ) : (
                    <div className="w-full h-20 rounded-lg bg-muted overflow-hidden">
                      <ImagePlaceholder className="w-full h-full" />
                    </div>
                  )}
                  {/* Upload Input */}
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="edit-image-upload"
                  />
                  <Label htmlFor="edit-image-upload" className="cursor-pointer">
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
                <Select value={editFormData.category} onValueChange={(value) => handleEditFormChange("category", value)}>
                  <SelectTrigger id="item-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Item Condition */}
              <div className="space-y-2">
                <Label htmlFor="item-condition">Condition</Label>
                <Select value={editFormData.condition} onValueChange={(value) => handleEditFormChange("condition", value)}>
                  <SelectTrigger id="item-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_CONDITIONS.map((cond) => (
                      <SelectItem key={cond} value={cond}>
                        {ITEM_CONDITION_LABELS[cond]}
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

              {/* Location Section */}
              <AddressForm
                value={editFormData.address}
                onChange={(addr) => setEditFormData({ ...editFormData, address: addr })}
                errors={fieldErrors}
                onClearError={clearFieldError}
              />

            </div>
          </ScrollArea>
        )}

        <DialogFooter className="gap-2 pt-2 shrink-0">
          {updateMessage && (
            <div className={`text-sm py-2 px-3 rounded ${
              updateMessage.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {updateMessage.text}
            </div>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} disabled={isUpdating}>
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
