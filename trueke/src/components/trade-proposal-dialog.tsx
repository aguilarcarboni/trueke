"use client"

import { useState } from "react"
import { X, ArrowLeftRight, Check, Package, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { items, currentUser, type Item } from "@/lib/data"

interface TradeProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestedItem: Item
}

const conditionColor: Record<string, string> = {
  "like-new": "bg-success/10 text-success border-success/20",
  good: "bg-primary/10 text-primary border-primary/20",
  fair: "bg-warning/10 text-warning border-warning/20",
  worn: "bg-accent/10 text-accent-foreground border-accent/20",
  bad: "bg-destructive/10 text-destructive border-destructive/20",
}

export function TradeProposalDialog({ open, onOpenChange, requestedItem }: TradeProposalDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Get user's items
  const myItems = items.filter((item) => item.owner.id === currentUser.id)

  // Filter items based on search
  const filteredItems = myItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleSubmit = () => {
    console.log("Trade proposal:", {
      offeredItems: selectedItems,
      requestedItem: requestedItem.id,
      message,
    })
    // Reset and close
    setSelectedItems([])
    setMessage("")
    setSearchQuery("")
    onOpenChange(false)
  }

  const selectedItemsData = items.filter((item) => selectedItems.includes(item.id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-primary" />
            Propose Trade
          </DialogTitle>
          <DialogDescription>
            Select items from your collection to offer in exchange for{" "}
            <span className="font-semibold text-foreground">{requestedItem.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trade Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* You're Offering */}
            <Card className="md:col-span-1">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">You're Offering</p>
                  {selectedItemsData.length === 0 ? (
                    <div className="py-8">
                      <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No items selected</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedItemsData.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 p-2 rounded-lg bg-muted text-left"
                        >
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="h-10 w-10 rounded object-cover"
                            crossOrigin="anonymous"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedItemsData.length > 0 && (
                    <Badge variant="secondary" className="mt-2">
                      {selectedItemsData.length} {selectedItemsData.length === 1 ? "item" : "items"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Exchange Icon */}
            <div className="hidden md:flex items-center justify-center">
              <div className="rounded-full bg-primary/10 p-4">
                <ArrowLeftRight className="h-6 w-6 text-primary" />
              </div>
            </div>

            {/* They're Offering */}
            <Card className="md:col-span-1">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">In Exchange For</p>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted text-left">
                    <img
                      src={requestedItem.images[0]}
                      alt={requestedItem.title}
                      className="h-10 w-10 rounded object-cover"
                      crossOrigin="anonymous"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{requestedItem.title}</p>
                      <p className="text-xs text-muted-foreground">{requestedItem.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-center pt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={requestedItem.owner.avatar} alt={requestedItem.owner.name} />
                      <AvatarFallback className="text-xs">{requestedItem.owner.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground">{requestedItem.owner.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Your Items Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Select Items to Offer</h3>
              <Badge variant="outline">{myItems.length} available</Badge>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search your items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
              {filteredItems.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No items match your search" : "You don't have any items to trade"}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedItems.includes(item.id)
                  return (
                    <Card
                      key={item.id}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="h-16 w-16 rounded-lg object-cover"
                              crossOrigin="anonymous"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-primary/20 rounded-lg flex items-center justify-center">
                                <div className="bg-primary rounded-full p-1">
                                  <Check className="h-3 w-3 text-primary-foreground" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-foreground truncate">{item.title}</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {item.category}
                              </Badge>
                              <Badge className={`text-xs border ${conditionColor[item.condition]}`}>
                                {item.condition}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>

          <Separator />

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Message <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              placeholder="Add a message to your trade proposal..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Introduce yourself and explain why you'd like to make this trade.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0}
              className="gap-2"
            >
              <ArrowLeftRight className="h-4 w-4" />
              Send Proposal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
