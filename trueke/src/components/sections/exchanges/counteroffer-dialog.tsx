"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowLeftRight, Check, Package, Search, Loader2, CalendarIcon, History } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { format, differenceInCalendarDays, startOfDay, addDays } from "date-fns"
import { cn } from "@/lib/utils"
import { createCounteroffer, getMyItems, getActiveItemsByUser } from "@/app/actions/exchange"
import { useToast } from "@/hooks/use-toast"
import { getConditionLabel, getConditionBadgeStyle } from "@/lib/entities/item"
import { getFriendlyErrorMessage } from "@/lib/error-messages"
import { ExchangeItemList } from "@/components/sections/exchanges/exchange-item-list"
import { ExchangeStatusBadge } from "@/components/sections/exchanges/exchange-status-badge"
import type { CounterOfferRequest, ExchangeListItemEnriched, ExchangeItem } from "@/lib/entities/exchange"
import type { Item } from "@/lib/entities/item"

const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="%23e5e7eb" viewBox="0 0 200 200"%3E%3Crect width="200" height="200"/%3E%3Ctext x="50%" y="50%" dy=".3em" text-anchor="middle" fill="%236b7280" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'

interface CounterOfferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The exchange being countered */
  exchange: ExchangeListItemEnriched
  currentUserId: string
  onSuccess?: () => void
}

/**
 * Dialog for creating a counteroffer (AC1–AC5).
 * Shows the original proposal for reference (AC2), lets the user pick different
 * items from their inventory (AC3), modify requested items (AC4),
 * and include an optional message (AC5).
 */
export function CounterOfferDialog({
  open,
  onOpenChange,
  exchange,
  currentUserId,
  onSuccess,
}: CounterOfferDialogProps) {
  const { toast } = useToast()

  // The other user in this exchange
  const otherUserId = exchange.initiator_id === currentUserId
    ? exchange.target_user_id
    : exchange.initiator_id
  const otherUserName = exchange.initiator_id === currentUserId
    ? exchange.target_name
    : exchange.initiator_name

  // Items the current user selects to OFFER
  const [offeredItemIds, setOfferedItemIds] = useState<string[]>([])
  // Items the current user selects to REQUEST from the other user
  const [requestedItemIds, setRequestedItemIds] = useState<string[]>([])
  const [message, setMessage] = useState("")
  const [expirationDate, setExpirationDate] = useState<Date | undefined>(
    addDays(new Date(), 7)
  )
  const [mySearchQuery, setMySearchQuery] = useState("")
  const [theirSearchQuery, setTheirSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetched item lists
  const [myItems, setMyItems] = useState<Item[]>([])
  const [theirItems, setTheirItems] = useState<Item[]>([])
  const [isLoadingMyItems, setIsLoadingMyItems] = useState(false)
  const [isLoadingTheirItems, setIsLoadingTheirItems] = useState(false)

  // Fetch items when dialog opens
  useEffect(() => {
    if (!open) return

    // Pre-select items from the original proposal (items currently in the exchange)
    // From the receiver's perspective: offered_items = what the initiator offered,
    // requested_items = what the initiator requested (i.e., my items)
    // For the counteroffer, we pre-select the reverse as a starting point
    const isSent = exchange.initiator_id === currentUserId
    const originallyOfferedToMe = isSent ? exchange.requested_items : exchange.offered_items
    const originallyRequestedFromMe = isSent ? exchange.offered_items : exchange.requested_items

    const preOffered = originallyRequestedFromMe.map((i: ExchangeItem) => i.item_id)
    const preRequested = originallyOfferedToMe.map((i: ExchangeItem) => i.item_id)

    setIsLoadingMyItems(true)
    getMyItems(currentUserId).then((result) => {
      if (result.success && result.data) {
        setMyItems(result.data)
        // Only pre-select items that are still active and owned by the current user
        const activeMyIds = new Set(result.data.map((i) => i.item_id))
        setOfferedItemIds(preOffered.filter((id: string) => activeMyIds.has(id)))
      } else {
        toast({
          title: "Couldn't load your items",
          description: getFriendlyErrorMessage(result.error),
          variant: "destructive",
        })
      }
      setIsLoadingMyItems(false)
    })

    setIsLoadingTheirItems(true)
    getActiveItemsByUser(otherUserId).then((result) => {
      if (result.success && result.data) {
        setTheirItems(result.data)
        // Only pre-select items that are still active and owned by the other user
        const activeTheirIds = new Set(result.data.map((i) => i.item_id))
        setRequestedItemIds(preRequested.filter((id: string) => activeTheirIds.has(id)))
      } else {
        toast({
          title: "Couldn't load their items",
          description: getFriendlyErrorMessage(result.error),
          variant: "destructive",
        })
      }
      setIsLoadingTheirItems(false)
    })
  }, [open, currentUserId, otherUserId, exchange, toast])

  // Filter items by search
  const filteredMyItems = useMemo(
    () => myItems.filter((item) =>
      item.title.toLowerCase().includes(mySearchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(mySearchQuery.toLowerCase())
    ),
    [myItems, mySearchQuery]
  )

  const filteredTheirItems = useMemo(
    () => theirItems.filter((item) =>
      item.title.toLowerCase().includes(theirSearchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(theirSearchQuery.toLowerCase())
    ),
    [theirItems, theirSearchQuery]
  )

  const toggleOffered = (itemId: string) => {
    setOfferedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  const toggleRequested = (itemId: string) => {
    setRequestedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }

  const handleSubmit = async () => {
    if (offeredItemIds.length === 0) {
      toast({
        title: "No items offered",
        description: "Pick at least one item from your collection to offer.",
        variant: "destructive",
      })
      return
    }

    if (requestedItemIds.length === 0) {
      toast({
        title: "No items requested",
        description: "Pick at least one item you want from the other user.",
        variant: "destructive",
      })
      return
    }

    if (!expirationDate) {
      toast({
        title: "No expiration date",
        description: "Please select an expiration date.",
        variant: "destructive",
      })
      return
    }

    const today = startOfDay(new Date())
    const expirationNum = differenceInCalendarDays(startOfDay(expirationDate), today)
    if (expirationNum <= 0) {
      toast({
        title: "Invalid expiration date",
        description: "Expiration date must be in the future.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const requestData: CounterOfferRequest = {
        parent_exchange_id: exchange.exchange_id,
        actor_user_id: currentUserId,
        offered_item_ids: offeredItemIds,
        requested_item_ids: requestedItemIds,
        message: message || undefined,
        expiration_days: expirationNum,
      }

      const result = await createCounteroffer(requestData)

      if (result.success) {
        toast({
          title: "Counteroffer sent!",
          description: "Your counteroffer has been sent. You'll be notified when they respond.",
        })
        setOfferedItemIds([])
        setRequestedItemIds([])
        setMessage("")
        setExpirationDate(addDays(new Date(), 7))
        setMySearchQuery("")
        setTheirSearchQuery("")
        onOpenChange(false)
        onSuccess?.()
      } else {
        toast({
          title: "Couldn't send counteroffer",
          description: getFriendlyErrorMessage(result.error),
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Connection error",
        description: "We couldn't reach the server. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Resolve selected item objects for the summary
  const selectedOfferedItems = myItems.filter((i) => offeredItemIds.includes(i.item_id))
  const selectedRequestedItems = theirItems.filter((i) => requestedItemIds.includes(i.item_id))

  // Original proposal details for reference (AC2)
  const isSent = exchange.initiator_id === currentUserId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5 text-amber-500" />
            Make a Counteroffer
          </DialogTitle>
          <DialogDescription>
            Propose different terms for this trade with{" "}
            <span className="font-semibold text-foreground">{otherUserName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* AC2: Original proposal reference */}
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-muted-foreground">Original Proposal</span>
              <ExchangeStatusBadge status={exchange.status} />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <ExchangeItemList
                label={isSent ? "You offered" : "They offered"}
                items={exchange.offered_items}
              />
              <ExchangeItemList
                label={isSent ? "You wanted" : "They wanted"}
                items={exchange.requested_items}
              />
            </div>
            {exchange.message && (
              <p className="text-xs text-muted-foreground italic">
                &ldquo;{exchange.message}&rdquo;
              </p>
            )}
          </div>

          <Separator />

          {/* Counteroffer summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Your offering */}
            <Card className="md:col-span-1">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">You&apos;re Offering</p>
                  {selectedOfferedItems.length === 0 ? (
                    <div className="py-6">
                      <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No items selected</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedOfferedItems.map((item) => (
                        <div
                          key={item.item_id}
                          className="flex items-start gap-2 p-2 rounded-md bg-muted text-left"
                        >
                          <img
                            src={item.images?.[0] || PLACEHOLDER_IMAGE}
                            alt={item.title}
                            className="h-8 w-8 rounded object-cover shrink-0"
                            crossOrigin="anonymous"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{item.title}</p>
                            <p className="text-[10px] text-muted-foreground">{item.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedOfferedItems.length > 0 && (
                    <Badge variant="secondary">
                      {selectedOfferedItems.length} {selectedOfferedItems.length === 1 ? "item" : "items"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Exchange icon */}
            <div className="hidden md:flex items-center justify-center">
              <div className="rounded-full bg-amber-500/10 p-4">
                <ArrowLeftRight className="h-6 w-6 text-amber-500" />
              </div>
            </div>

            {/* You're requesting */}
            <Card className="md:col-span-1">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">You Want</p>
                  {selectedRequestedItems.length === 0 ? (
                    <div className="py-6">
                      <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No items selected</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedRequestedItems.map((item) => (
                        <div
                          key={item.item_id}
                          className="flex items-start gap-2 p-2 rounded-md bg-muted text-left"
                        >
                          <img
                            src={item.images?.[0] || PLACEHOLDER_IMAGE}
                            alt={item.title}
                            className="h-8 w-8 rounded object-cover shrink-0"
                            crossOrigin="anonymous"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">{item.title}</p>
                            <p className="text-[10px] text-muted-foreground">{item.category}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedRequestedItems.length > 0 && (
                    <Badge variant="secondary">
                      {selectedRequestedItems.length} {selectedRequestedItems.length === 1 ? "item" : "items"}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* AC3: Select items from your inventory to offer */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Your Items to Offer</h3>
              <Badge variant="outline">{myItems.length} available</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search your items..."
                value={mySearchQuery}
                onChange={(e) => setMySearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-2">
              {isLoadingMyItems ? (
                <div className="col-span-2 text-center py-6">
                  <Loader2 className="h-8 w-8 text-muted-foreground/30 mx-auto animate-spin" />
                  <p className="text-sm text-muted-foreground mt-2">Loading your items...</p>
                </div>
              ) : filteredMyItems.length === 0 ? (
                <div className="col-span-2 text-center py-6">
                  <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {mySearchQuery ? "No items match your search" : "No items available"}
                  </p>
                </div>
              ) : (
                filteredMyItems.map((item) => {
                  const isSelected = offeredItemIds.includes(item.item_id)
                  return (
                    <Card
                      key={item.item_id}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => toggleOffered(item.item_id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <img
                              src={item.images?.[0] || PLACEHOLDER_IMAGE}
                              alt={item.title}
                              className="h-14 w-14 rounded-lg object-cover"
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
                            <h4 className="text-sm font-semibold truncate">{item.title}</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                              <Badge className={`text-xs border ${getConditionBadgeStyle(item.condition)}`}>
                                {getConditionLabel(item.condition)}
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

          {/* AC4: Select items from their inventory to request */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Items You Want from {otherUserName}</h3>
              <Badge variant="outline">{theirItems.length} available</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search their items..."
                value={theirSearchQuery}
                onChange={(e) => setTheirSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[240px] overflow-y-auto pr-2">
              {isLoadingTheirItems ? (
                <div className="col-span-2 text-center py-6">
                  <Loader2 className="h-8 w-8 text-muted-foreground/30 mx-auto animate-spin" />
                  <p className="text-sm text-muted-foreground mt-2">Loading their items...</p>
                </div>
              ) : filteredTheirItems.length === 0 ? (
                <div className="col-span-2 text-center py-6">
                  <Package className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {theirSearchQuery ? "No items match your search" : "No items available"}
                  </p>
                </div>
              ) : (
                filteredTheirItems.map((item) => {
                  const isSelected = requestedItemIds.includes(item.item_id)
                  return (
                    <Card
                      key={item.item_id}
                      className={`cursor-pointer transition-all hover:border-amber-500/50 ${
                        isSelected ? "border-amber-500 bg-amber-500/5" : ""
                      }`}
                      onClick={() => toggleRequested(item.item_id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <img
                              src={item.images?.[0] || PLACEHOLDER_IMAGE}
                              alt={item.title}
                              className="h-14 w-14 rounded-lg object-cover"
                              crossOrigin="anonymous"
                            />
                            {isSelected && (
                              <div className="absolute inset-0 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                <div className="bg-amber-500 rounded-full p-1">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold truncate">{item.title}</h4>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                              <Badge className={`text-xs border ${getConditionBadgeStyle(item.condition)}`}>
                                {getConditionLabel(item.condition)}
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

          {/* AC5: Optional message */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Message <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <Textarea
              placeholder="Explain your counteroffer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Let them know why you&apos;re suggesting different terms.
            </p>
          </div>

          {/* Expiration date */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              Counteroffer Expiration Date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expirationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expirationDate ? format(expirationDate, "PPP") : "Pick an expiration date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expirationDate}
                  onSelect={setExpirationDate}
                  disabled={(date) => date <= new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Select the date by which the other user must respond.
              {expirationDate && (
                <span className="font-medium text-foreground">
                  {" "}({differenceInCalendarDays(startOfDay(expirationDate), startOfDay(new Date()))} days from today)
                </span>
              )}
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
              disabled={offeredItemIds.length === 0 || requestedItemIds.length === 0 || isSubmitting}
              className="gap-2 bg-amber-500 text-white hover:bg-amber-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="h-4 w-4" />
                  Send Counteroffer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
