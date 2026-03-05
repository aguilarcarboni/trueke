"use client"

import { useState, useEffect } from "react"
import { X, ArrowLeftRight, Check, Package, Search, Loader2, ArrowLeft } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { createExchangeProposal, getMyItems } from "@/app/actions/exchange-actions"
import { useToast } from "@/hooks/use-toast"
import type { CreateExchangeRequest } from "@/lib/types"

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="%23e5e7eb" viewBox="0 0 200 200"%3E%3Crect width="200" height="200"/%3E%3Ctext x="50%" y="50%" dy=".3em" text-anchor="middle" fill="%236b7280" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'

interface Item {
  item_id: string
  title: string
  description: string
  condition: string
  category: string
  images: string[]
  owner_user_id: string
  // Optional owner info
  owner_name?: string
  owner_avatar?: string
}

interface TradeProposalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestedItem: Item
  currentUserId: string
  onBack?: () => void
}

const conditionColor: Record<string, string> = {
  "like-new": "bg-success/10 text-success border-success/20",
  good: "bg-primary/10 text-primary border-primary/20",
  fair: "bg-warning/10 text-warning border-warning/20",
  worn: "bg-accent/10 text-accent-foreground border-accent/20",
  bad: "bg-destructive/10 text-destructive border-destructive/20",
}

// Helper component for item hover preview
function ItemPreview({ item }: { item: Item }) {
  return (
    <div className="w-full">
      <img
        src={item.images?.[0]}
        alt={item.title}
        className="w-full h-32 rounded-lg object-cover mb-3"
        crossOrigin="anonymous"
      />
      <div className="space-y-2">
        <div>
          <p className="font-semibold text-sm text-foreground leading-tight">{item.title}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs text-muted-foreground">{item.category}</p>
          <div className="flex gap-2 flex-wrap">
            <Badge className={`text-xs border ${
              item.condition === 'like-new' ? 'bg-success/10 text-success border-success/20' :
              item.condition === 'good' ? 'bg-primary/10 text-primary border-primary/20' :
              item.condition === 'fair' ? 'bg-warning/10 text-warning border-warning/20' :
              item.condition === 'worn' ? 'bg-accent/10 text-accent-foreground border-accent/20' :
              'bg-destructive/10 text-destructive border-destructive/20'
            }`}>
              {item.condition}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-3 pt-1">{item.description}</p>
      </div>
    </div>
  )
}

export function TradeProposalDialog({ 
  open, 
  onOpenChange, 
  requestedItem, 
  currentUserId,
  onBack 
}: TradeProposalDialogProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [expirationDays, setExpirationDays] = useState<string>("7")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [myItems, setMyItems] = useState<Item[]>([])
  const [isLoadingItems, setIsLoadingItems] = useState(false)
  const { toast } = useToast()

  // Fetch user's items when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoadingItems(true)
      getMyItems(currentUserId).then((result) => {
        if (result.success && result.data) {
          setMyItems(result.data)
        } else {
          toast({
            title: "Error",
            description: "Failed to load your items",
            variant: "destructive",
          })
        }
        setIsLoadingItems(false)
      })
    }
  }, [open, currentUserId, toast])

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

  const handleSubmit = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to trade.",
        variant: "destructive",
      })
      return
    }

    // Validate expiration days
    const expirationNum = parseInt(expirationDays, 10)
    if (isNaN(expirationNum) || expirationNum < 1) {
      toast({
        title: "Invalid expiration",
        description: "Expiration must be at least 1 day.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const requestData: CreateExchangeRequest = {
        initiator_id: currentUserId,
        target_user_id: requestedItem.owner_user_id,
        offered_item_ids: selectedItems,
        requested_item_ids: [requestedItem.item_id],
        message: message || undefined,
        expiration_days: expirationNum,
      }
      
      console.log("📤 Sending trade proposal with data:", requestData)
      
      const result = await createExchangeProposal(requestData)

      console.log("📥 Response from server:", result)

      if (result.success) {
        toast({
          title: "Success",
          description: "Trade proposal sent successfully!",
        })
        
        // Reset and close
        setSelectedItems([])
        setMessage("")
        setExpirationDays("7")
        setSearchQuery("")
        onOpenChange(false)
      } else {
        console.error("Error response:", result.error)
        toast({
          title: "Error",
          description: result.error || "Failed to send trade proposal.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting trade proposal:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedItemsData = myItems.filter((item) => selectedItems.includes(item.item_id))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          ) : null}
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
                        <HoverCard key={item.item_id}>
                          <HoverCardTrigger asChild>
                            <div
                              className="flex items-start gap-3 p-3 rounded-lg bg-muted text-left cursor-help hover:bg-muted/80 transition-colors"
                            >
                              <img
                                src={item.images?.[0] || PLACEHOLDER_IMAGE}
                                alt={item.title}
                                className="h-10 w-10 rounded object-cover shrink-0 mt-0.5"
                                crossOrigin="anonymous"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground line-clamp-2">{item.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{item.category}</p>
                              </div>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-64">
                            <ItemPreview item={item} />
                          </HoverCardContent>
                        </HoverCard>
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
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="flex items-start gap-3 p-3 rounded-lg bg-muted text-left cursor-help hover:bg-muted/80 transition-colors">
                        <img
                          src={requestedItem.images?.[0] || PLACEHOLDER_IMAGE}
                          alt={requestedItem.title}
                          className="h-10 w-10 rounded object-cover shrink-0 mt-0.5"
                          crossOrigin="anonymous"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground line-clamp-2">{requestedItem.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{requestedItem.category}</p>
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64">
                      <ItemPreview item={requestedItem} />
                    </HoverCardContent>
                  </HoverCard>
                  <div className="flex items-center gap-2 justify-center pt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={requestedItem.owner_avatar} alt={requestedItem.owner_name} />
                      <AvatarFallback className="text-xs">{requestedItem.owner_name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-muted-foreground">{requestedItem.owner_name || "Unknown"}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-2 flex-1">
              {isLoadingItems ? (
                <div className="col-span-2 text-center py-8">
                  <Loader2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading your items...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="col-span-2 text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {searchQuery ? "No items match your search" : "You don't have any items to trade"}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isSelected = selectedItems.includes(item.item_id)
                  return (
                    <Card
                      key={item.item_id}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => toggleItemSelection(item.item_id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <img
                              src={item.images?.[0] || PLACEHOLDER_IMAGE}
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

          {/* Expiration */}
          <div className="space-y-2">
            <label htmlFor="expiration" className="text-sm font-semibold text-foreground">
              Proposal Expiration <span className="text-muted-foreground font-normal">(days)</span>
            </label>
            <Input
              id="expiration"
              type="number"
              min="1"
              value={expirationDays}
              onChange={(e) => setExpirationDays(e.target.value)}
              placeholder="7"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How many days should the recipient have to respond? (default: 7 days)
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedItems.length === 0 || isSubmitting}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="h-4 w-4" />
                  Send Proposal
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
