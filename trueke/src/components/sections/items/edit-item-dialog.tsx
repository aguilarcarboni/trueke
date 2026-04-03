"use client"

import { useState, useEffect } from "react"
import { ItemCondition, ItemType, ItemStatus, ItemWithAddress, ITEM_CONDITIONS, ITEM_CONDITION_LABELS, ITEM_STATUSES, ITEM_STATUS_LABELS } from "@/lib/entities/item"
import { ITEM_CATEGORIES } from "@/lib/data"
import { X, Package, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { updateItem, updateItemImages } from "@/app/actions/item"
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
    state: "draft" as typeof ITEM_STATUSES[number],
    category: "",
    condition: "new" as ItemCondition,
    description: "",
    imagePreviews: [] as string[],
    address: { ...EMPTY_ADDRESS },
  })

  // Initialize form data when dialog opens or item changes
  useEffect(() => {
    if (item && open) {
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
  }, [item, open])

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

  const handleMoveImageUp = (index: number) => {
    if (index === 0) return
    setEditFormData((prev) => {
      const updated = [...prev.imagePreviews]
      ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
      return { ...prev, imagePreviews: updated }
    })
  }

  const handleMoveImageDown = (index: number) => {
    setEditFormData((prev) => {
      if (index >= prev.imagePreviews.length - 1) return prev
      const updated = [...prev.imagePreviews]
      ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
      return { ...prev, imagePreviews: updated }
    })
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
      const [result, imagesResult] = await Promise.all([
        updateItem(
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
        ),
        updateItemImages(item.item_id, editFormData.imagePreviews),
      ])

      if (result.error) {
        setUpdateMessage({ type: 'error', text: result.error })
        return
      }

      if (imagesResult.error) {
        setUpdateMessage({ type: 'error', text: imagesResult.error })
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
    <Dialog open={open} onOpenChange={(next) => { if (!next) { setUpdateMessage(null); setFieldErrors({}) } onOpenChange(next) }}>
      <DialogContent className="flex flex-col w-full max-w-3xl max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        {item && (
          <ScrollArea className="flex-1 overflow-y-auto pr-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">

                  {updateMessage && (
                    <div className={`rounded-md border px-4 py-3 text-sm ${
                      updateMessage.type === 'success'
                        ? 'border-green-300 bg-green-50 text-green-700'
                        : 'border-red-300 bg-red-50 text-red-700'
                    }`}>
                      {updateMessage.text}
                    </div>
                  )}

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="item-title">Item Name *</Label>
                    <Input
                      id="item-title"
                      value={editFormData.title}
                      onChange={(e) => handleEditFormChange("title", e.target.value)}
                      placeholder="Enter a descriptive title for your item"
                    />
                  </div>

                  {/* Category + Type */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="item-category">Category *</Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="item-type">Type *</Label>
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
                  </div>

                  {/* Condition + Status */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="item-condition">Condition *</Label>
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

                    <div className="space-y-2">
                      <Label htmlFor="item-status">Status *</Label>
                      <Select value={editFormData.state} onValueChange={(value) => handleEditFormChange("state", value)}>
                        <SelectTrigger id="item-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(['draft', 'active', 'archived'] as typeof ITEM_STATUSES[number][]).map((status) => (
                            <SelectItem key={status} value={status}>
                              {ITEM_STATUS_LABELS[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Address */}
                  <AddressForm
                    value={editFormData.address}
                    onChange={(addr) => setEditFormData({ ...editFormData, address: addr })}
                    errors={fieldErrors}
                    onClearError={clearFieldError}
                  />

                  {/* Images */}
                  <div className="space-y-2">
                    <Label>Item Images</Label>
                    <div className="space-y-3">
                      {editFormData.imagePreviews.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {editFormData.imagePreviews.map((preview, index) => (
                            <div key={preview} className="relative group">
                              <div className="w-full h-24 rounded-lg bg-muted overflow-hidden">
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
                              <span className="absolute top-1 left-1 rounded bg-black/60 px-1 text-[10px] font-medium text-white">
                                {index + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-destructive transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                              <div className="absolute bottom-1 right-1 flex gap-0.5">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveImageUp(index)}
                                  className="flex h-5 w-5 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === editFormData.imagePreviews.length - 1}
                                  onClick={() => handleMoveImageDown(index)}
                                  className="flex h-5 w-5 items-center justify-center rounded bg-black/60 text-white hover:bg-black/80 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="w-full h-20 rounded-lg bg-muted overflow-hidden">
                          <ImagePlaceholder className="w-full h-full" />
                        </div>
                      )}
                      <Input
                        id="edit-image-upload"
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={handleImageUpload}
                      />
                      <p className="text-xs text-muted-foreground">Max 10MB. JPG, PNG, WEBP, or GIF.</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="item-description">Description *</Label>
                    <Textarea
                      id="item-description"
                      value={editFormData.description}
                      onChange={(e) => handleEditFormChange("description", e.target.value)}
                      placeholder="Describe your item in detail. Include important condition notes, features, or history."
                      className="min-h-32"
                    />
                  </div>

                  {/* Footer buttons */}
                  <div className="flex gap-3 pt-4 border-t border-border">
                    <Button variant="outline" onClick={() => { setUpdateMessage(null); setFieldErrors({}); onOpenChange(false) }} type="button" disabled={isUpdating}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveEdit} className="flex-1" disabled={isUpdating}>
                      {isUpdating ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>

                </div>
              </CardContent>
            </Card>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
