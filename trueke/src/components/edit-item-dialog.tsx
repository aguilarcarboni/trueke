"use client"

import { useState, useEffect } from "react"
import { Item, ItemCondition, ItemType, ItemState } from "@/lib/data"
import { X, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { updateItem } from "@/app/items/actions"
import { Country, State, City } from "country-state-city"

// Validation patterns for location fields
const LOCATION_TEXT = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-,\.]+$/
const ZIPCODE_PATTERN = /^[a-zA-Z0-9\s\-]+$/
const ADDRESS_LINE_PATTERN = /^[a-zA-Z0-9À-ÖØ-öø-ÿ\s'\-\.,#\/]+$/

const EMPTY_ADDRESS = {
  countryCode: "",
  addressLine1: "",
  addressLine2: "",
  muniDistrict: "",
  city: "",
  province: "",
  zipCode: "",
}

// Placeholder component for items without images
function ImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-muted ${className}`}>
      <Package className="h-12 w-12 text-muted-foreground" />
    </div>
  )
}

const conditionLabel: Record<string, string> = {
  "new": "New",
  "like new": "Like New",
  "used": "Used",
  "heavily used": "Heavily Used",
  "broken": "Broken",
}

const itemTypes = ["physical", "digital"]
const itemStatuses: string[] = ["draft", "active", "traded", "contested"]

interface EditItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item | null
  onItemUpdated?: (updatedItem: Item) => void
}

export function EditItemDialog({ open, onOpenChange, item, onItemUpdated }: EditItemDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stateCode, setStateCode] = useState<string>("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [shakingFields, setShakingFields] = useState<Record<string, boolean>>({})
  const [editFormData, setEditFormData] = useState({
    title: "",
    type: "physical" as ItemType,
    state: "draft" as ItemState,
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
        type: item.type,
        state: item.state,
        category: item.category,
        condition: item.condition,
        description: item.description || "",
        imagePreviews: item.images || [],
        address: (item as any).address ? { ...(item as any).address } : { ...EMPTY_ADDRESS },
      })
      setStateCode("")
      setFieldErrors({})
      setUpdateMessage(null)
    }
  }, [item])

  const triggerShake = (field: string) => {
    setShakingFields((prev) => ({ ...prev, [field]: true }))
    setTimeout(() => setShakingFields((prev) => ({ ...prev, [field]: false })), 400)
  }

  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }))

  const inputCls = (field: string) =>
    `${fieldErrors[field] || shakingFields[field] ? " border-destructive" : ""}${shakingFields[field] ? " shake" : ""}`

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

    // Validate required location fields
    const errors: Record<string, string> = {}
    if (!editFormData.address.countryCode.trim()) errors.countryCode = "Country is required."
    if (!editFormData.address.province.trim()) errors.province = "Province / State is required."
    else if (!LOCATION_TEXT.test(editFormData.address.province.trim())) errors.province = "Province may only contain letters."
    if (!editFormData.address.city.trim()) errors.city = "City is required."
    else if (!LOCATION_TEXT.test(editFormData.address.city.trim())) errors.city = "City may only contain letters."
    if (!editFormData.address.zipCode.trim()) errors.zipCode = "Zip code is required."
    else if (!ZIPCODE_PATTERN.test(editFormData.address.zipCode.trim())) errors.zipCode = "Zip code may only contain letters, numbers and hyphens."

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})

    setIsUpdating(true)
    setUpdateMessage(null)

    try {
      const result = await updateItem(item.id, {
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
        const updatedItem: Item = {
          ...item,
          title: editFormData.title,
          type: editFormData.type,
          state: editFormData.state,
          category: editFormData.category,
          condition: editFormData.condition,
          description: editFormData.description,
          images: editFormData.imagePreviews,
        }
        
        onItemUpdated?.(updatedItem)
        setUpdateMessage({ type: 'success', text: 'Item updated successfully!' })
        onOpenChange(false)
      }
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

              {/* Location Section */}
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium text-muted-foreground">Item Location</p>

                {/* Country */}
                <div className="space-y-1">
                  <Label className="text-xs">Country <span className="text-destructive">*</span></Label>
                  <Select
                    value={editFormData.address.countryCode}
                    onValueChange={(val) => {
                      setEditFormData({
                        ...editFormData,
                        address: { ...editFormData.address, countryCode: val, province: "", city: "" },
                      })
                      setStateCode("")
                      if (fieldErrors.countryCode) clearFieldError("countryCode")
                      if (fieldErrors.province) clearFieldError("province")
                      if (fieldErrors.city) clearFieldError("city")
                    }}
                  >
                    <SelectTrigger className={`h-8 text-sm w-full${fieldErrors.countryCode ? " border-destructive" : ""}`}>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {Country.getAllCountries()
                        .filter((c) => c.isoCode === "CR")
                        .map((c) => (
                          <SelectItem key={c.isoCode} value={c.isoCode}>
                            {c.name} ({c.isoCode})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.countryCode && <p className="text-xs text-destructive">{fieldErrors.countryCode}</p>}
                </div>

                {/* Province / State */}
                {(() => {
                  const states = editFormData.address.countryCode
                    ? State.getStatesOfCountry(editFormData.address.countryCode)
                    : []
                  return (
                    <div className="space-y-1">
                      <Label className="text-xs">Province / State <span className="text-destructive">*</span></Label>
                      {states.length > 0 ? (
                        <Select
                          value={stateCode}
                          onValueChange={(val) => {
                            const state = states.find((s) => s.isoCode === val)
                            setStateCode(val)
                            setEditFormData({
                              ...editFormData,
                              address: { ...editFormData.address, province: state?.name ?? val, city: "" },
                            })
                            if (fieldErrors.province) clearFieldError("province")
                            if (fieldErrors.city) clearFieldError("city")
                          }}
                        >
                          <SelectTrigger className={`h-8 text-sm w-full${fieldErrors.province ? " border-destructive" : ""}`}>
                            <SelectValue placeholder="Select state / province" />
                          </SelectTrigger>
                          <SelectContent>
                            {states.map((s) => (
                              <SelectItem key={s.isoCode} value={s.isoCode}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={editFormData.address.province}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val.length > 75) { triggerShake("province"); return }
                            if (val !== "" && !LOCATION_TEXT.test(val)) { triggerShake("province"); return }
                            setEditFormData({ ...editFormData, address: { ...editFormData.address, province: val } })
                            if (fieldErrors.province) clearFieldError("province")
                          }}
                          placeholder="Province / State"
                          className={`h-8 text-sm${inputCls("province")}`}
                        />
                      )}
                      {fieldErrors.province && <p className="text-xs text-destructive">{fieldErrors.province}</p>}
                    </div>
                  )
                })()}

                {/* City */}
                {(() => {
                  const cities = stateCode
                    ? City.getCitiesOfState(editFormData.address.countryCode, stateCode)
                    : editFormData.address.countryCode && !State.getStatesOfCountry(editFormData.address.countryCode).length
                      ? City.getCitiesOfCountry(editFormData.address.countryCode) ?? []
                      : []
                  return (
                    <div className="space-y-1">
                      <Label className="text-xs">City <span className="text-destructive">*</span></Label>
                      {cities.length > 0 ? (
                        <Select
                          value={editFormData.address.city}
                          onValueChange={(val) => {
                            setEditFormData({ ...editFormData, address: { ...editFormData.address, city: val } })
                            if (fieldErrors.city) clearFieldError("city")
                          }}
                        >
                          <SelectTrigger className={`h-8 text-sm w-full${fieldErrors.city ? " border-destructive" : ""}`}>
                            <SelectValue placeholder="Select city" />
                          </SelectTrigger>
                          <SelectContent>
                            {cities.map((c) => (
                              <SelectItem key={`${c.name}-${c.stateCode}`} value={c.name}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          value={editFormData.address.city}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val.length > 75) { triggerShake("city"); return }
                            if (val !== "" && !LOCATION_TEXT.test(val)) { triggerShake("city"); return }
                            setEditFormData({ ...editFormData, address: { ...editFormData.address, city: val } })
                            if (fieldErrors.city) clearFieldError("city")
                          }}
                          placeholder="City"
                          className={`h-8 text-sm${inputCls("city")}`}
                        />
                      )}
                      {fieldErrors.city && <p className="text-xs text-destructive">{fieldErrors.city}</p>}
                    </div>
                  )
                })()}

                {/* Municipality / Zip */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="muniDistrict" className="text-xs">Municipality / District</Label>
                    <Input
                      id="muniDistrict"
                      value={editFormData.address.muniDistrict}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val.length > 100) { triggerShake("muniDistrict"); return }
                        if (val !== "" && !LOCATION_TEXT.test(val)) { triggerShake("muniDistrict"); return }
                        setEditFormData({ ...editFormData, address: { ...editFormData.address, muniDistrict: val } })
                        if (fieldErrors.muniDistrict) clearFieldError("muniDistrict")
                      }}
                      placeholder="Mata Redonda"
                      className={`h-8 text-sm${inputCls("muniDistrict")}`}
                    />
                    {fieldErrors.muniDistrict && <p className="text-xs text-destructive">{fieldErrors.muniDistrict}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="zipCode" className="text-xs">Zip code <span className="text-destructive">*</span></Label>
                    <Input
                      id="zipCode"
                      value={editFormData.address.zipCode}
                      onChange={(e) => {
                        const val = e.target.value
                        if (val.length > 10) { triggerShake("zipCode"); return }
                        if (val !== "" && !ZIPCODE_PATTERN.test(val)) { triggerShake("zipCode"); return }
                        setEditFormData({ ...editFormData, address: { ...editFormData.address, zipCode: val } })
                        if (fieldErrors.zipCode) clearFieldError("zipCode")
                      }}
                      placeholder="10103"
                      className={`h-8 text-sm${inputCls("zipCode")}`}
                    />
                    {fieldErrors.zipCode && <p className="text-xs text-destructive">{fieldErrors.zipCode}</p>}
                  </div>
                </div>

                {/* Address lines */}
                <div className="space-y-1">
                  <Label htmlFor="addressLine1" className="text-xs">Address line 1</Label>
                  <Input
                    id="addressLine1"
                    value={editFormData.address.addressLine1}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val !== "" && !ADDRESS_LINE_PATTERN.test(val)) { triggerShake("addressLine1"); return }
                      setEditFormData({ ...editFormData, address: { ...editFormData.address, addressLine1: val } })
                    }}
                    placeholder="Street, building..."
                    className={`h-8 text-sm${shakingFields.addressLine1 ? " border-destructive shake" : ""}`}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="addressLine2" className="text-xs">Address line 2</Label>
                  <Input
                    id="addressLine2"
                    value={editFormData.address.addressLine2}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val !== "" && !ADDRESS_LINE_PATTERN.test(val)) { triggerShake("addressLine2"); return }
                      setEditFormData({ ...editFormData, address: { ...editFormData.address, addressLine2: val } })
                    }}
                    placeholder="Apartment, suite..."
                    className={`h-8 text-sm${shakingFields.addressLine2 ? " border-destructive shake" : ""}`}
                  />
                </div>
              </div>
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
