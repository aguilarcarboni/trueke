"use client"

import { Item } from "@/lib/data"
import { Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

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

const statusColors: Record<string, string> = {
  active: "bg-success/20 text-success",
  draft: "bg-muted/20 text-muted-foreground",
  traded: "bg-accent/20 text-accent-foreground",
  contested: "bg-warning/20 text-warning-foreground"
}

interface ViewItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item | null
}

export function ViewItemDialog({ open, onOpenChange, item }: ViewItemDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Item Details</DialogTitle>
        </DialogHeader>

        {item && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Item Image */}
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="w-full h-48 rounded-lg bg-muted overflow-hidden">
                {item.images && item.images.length > 0 ? (
                  <img 
                    src={item.images[0]} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                ) : null}
                <ImagePlaceholder className={`w-full h-full ${item.images && item.images.length > 0 ? 'hidden' : ''}`} />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">Title</Label>
              <p className="text-foreground font-medium">{item.title}</p>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">Description</Label>
              <p className="text-foreground text-sm whitespace-pre-wrap">{item.description || "No description"}</p>
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">Category</Label>
              <p className="text-foreground">{item.category}</p>
            </div>

            {/* Type */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">Type</Label>
              <p className="text-foreground capitalize">{item.type}</p>
            </div>

            {/* Condition */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">Condition</Label>
              <div>
                <Badge variant="secondary">{conditionLabel[item.condition]}</Badge>
              </div>
            </div>

            {/* State/Status */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">Status</Label>
              <div>
                <Badge className={statusColors[item.state] || ""}>
                  {item.state.charAt(0).toUpperCase() + item.state.slice(1)}
                </Badge>
              </div>
            </div>

            {/* Created Date */}
            <div className="space-y-1">
              <Label className="text-muted-foreground">Created</Label>
              <p className="text-foreground text-sm">{new Date(item.createdAt).toLocaleDateString()}</p>
            </div>

            {/* Location */}
            {item.address && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">Location</Label>
                <div className="text-foreground text-sm space-y-1">
                  {item.address.addressLine1 && (
                    <p>{item.address.addressLine1}</p>
                  )}
                  {item.address.addressLine2 && (
                    <p>{item.address.addressLine2}</p>
                  )}
                  <p>
                    {[
                      item.address.muniDistrict,
                      item.address.city,
                      item.address.province,
                    ].filter(Boolean).join(", ")}
                  </p>
                  <p>
                    {[
                      item.address.zipCode,
                      item.address.countryCode,
                    ].filter(Boolean).join(" ")}
                  </p>
                </div>
              </div>
            )}

            {/* Additional Images */}
            {item.images && item.images.length > 1 && (
              <div className="space-y-2">
                <Label className="text-muted-foreground">All Images ({item.images.length})</Label>
                <div className="grid grid-cols-3 gap-2">
                  {item.images.map((url, index) => (
                    <div key={index} className="w-full h-20 rounded-lg bg-muted overflow-hidden">
                      <img 
                        src={url} 
                        alt={`Image ${index + 1}`} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      <ImagePlaceholder className="w-full h-full hidden" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
