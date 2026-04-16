"use client"

import { useState, useMemo } from "react"
import { ArrowLeftRight, Search, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { TradeProposalDialog } from "@/components/sections/exchanges/trade-proposal-dialog"
import { ExchangeCard } from "@/components/sections/exchanges/exchange-card"
import { useExchangeData } from "@/hooks/use-exchange-data"
import { useExchangeActions } from "@/hooks/use-exchange-actions"
import type { Item } from "@/lib/entities/item"

// Placeholder for items without images
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="%23e5e7eb" viewBox="0 0 200 200"%3E%3Crect width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dy=".3em" text-anchor="middle" fill="%236b7280" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'

interface ExchangesProps {
  currentUserId: string
}

/**
 * Top-level orchestrator for the Exchanges page.
 * Composes data hooks, action hooks, and presentational components.
 * No business logic lives here — it delegates to hooks and child components.
 */
export function Exchanges({ currentUserId }: ExchangesProps) {
  // ─── State: UI-only concerns ─────────────────────────────────
  const [directionFilter, setDirectionFilter] = useState<"all" | "sent" | "received">("all")
  const [statusTab, setStatusTab] = useState("all")
  const [isSelectingItem, setIsSelectingItem] = useState(false)
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // ─── Data & actions (delegated to hooks) ─────────────────────
  const { exchanges, availableItems, isLoading, reloadExchanges } =
    useExchangeData(currentUserId)

  const { actionLoading, handleAccept, handleReject, handleCancel, handleComplete, handleCounteroffer } =
    useExchangeActions(currentUserId, reloadExchanges)

  // ─── Derived state ───────────────────────────────────────────
  const filteredExchanges = useMemo(() => {
    let result = exchanges

    // Direction filter
    if (directionFilter === "sent") {
      result = result.filter((e) => e.initiator_id === currentUserId)
    } else if (directionFilter === "received") {
      result = result.filter((e) => e.initiator_id !== currentUserId)
    }

    // Status filter
    if (statusTab !== "all") {
      result = result.filter((e) => e.status === statusTab)
    }

    return result
  }, [exchanges, directionFilter, statusTab, currentUserId])

  /** Count exchanges matching the current direction filter with a given status. */
  const countByStatus = useMemo(() => {
    let base = exchanges
    if (directionFilter === "sent") base = base.filter((e) => e.initiator_id === currentUserId)
    else if (directionFilter === "received") base = base.filter((e) => e.initiator_id !== currentUserId)
    return {
      all: base.length,
      pending: base.filter((e) => e.status === "pending").length,
      accepted: base.filter((e) => e.status === "accepted").length,
      rejected: base.filter((e) => e.status === "rejected").length,
      completed: base.filter((e) => e.status === "completed").length,
    }
  }, [exchanges, directionFilter, currentUserId])

  const filteredAvailableItems = useMemo(
    () =>
      availableItems.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [availableItems, searchQuery]
  )

  // ─── Handlers (UI-only) ─────────────────────────────────────
  const handleSelectItem = (item: Item) => {
    setSelectedItem(item)
    setIsSelectingItem(false)
    setIsTradeDialogOpen(true)
    setSearchQuery("")
  }

  const handleBackToSelection = () => {
    setIsTradeDialogOpen(false)
    setIsSelectingItem(true)
  }

  // ─── Loading state ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="flex min-h-full w-full flex-1 flex-col space-y-6">
      {/* Item Selection Dialog */}
      <Dialog open={isSelectingItem} onOpenChange={setIsSelectingItem}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Select Item to Propose Trade
            </DialogTitle>
            <DialogDescription className="line-clamp-2">
              Choose an item from the marketplace to propose a trade for
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            <div className="grid gap-3 overflow-y-auto flex-1 pr-4">
              {filteredAvailableItems.length > 0 ? (
                filteredAvailableItems.map((item) => (
                  <button
                    key={item.item_id}
                    onClick={() => handleSelectItem(item)}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent transition-colors text-left"
                  >
                    <img
                      src={item.images?.[0] || PLACEHOLDER_IMAGE}
                      alt={item.title}
                      className="h-16 w-16 rounded object-cover shrink-0"
                      crossOrigin="anonymous"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-sm truncate">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.condition}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  {searchQuery ? "No items match your search" : "No items available"}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trade Proposal Dialog */}
      {selectedItem && (
        <TradeProposalDialog
          open={isTradeDialogOpen}
          onOpenChange={setIsTradeDialogOpen}
          requestedItem={selectedItem}
          currentUserId={currentUserId}
          onBack={handleBackToSelection}
          onSuccess={reloadExchanges}
        />
      )}

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exchanges</h1>
          <p className="text-muted-foreground mt-1">
            Manage your trade proposals and negotiations.
          </p>
        </div>
        <Button
          onClick={() => setIsSelectingItem(true)}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeftRight className="h-4 w-4" />
          New Trade
        </Button>
      </div>

      {/* Direction filter (pill toggle) */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-1">Show:</span>
        {(["all", "sent", "received"] as const).map((value) => {
          const labels = { all: "All", sent: "Sent", received: "Received" } as const
          const counts = {
            all: exchanges.length,
            sent: exchanges.filter((e) => e.initiator_id === currentUserId).length,
            received: exchanges.filter((e) => e.initiator_id !== currentUserId).length,
          }
          return (
            <button
              key={value}
              onClick={() => setDirectionFilter(value)}
              className={`rounded-full px-3.5 py-1 text-sm font-medium transition-colors ${
                directionFilter === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {labels[value]} ({counts[value]})
            </button>
          )
        })}
      </div>

      {/* Status tabs + Cards */}
      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <TabsList>
          <TabsTrigger value="all">
            All ({countByStatus.all})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Open ({countByStatus.pending})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({countByStatus.accepted})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({countByStatus.rejected})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({countByStatus.completed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={statusTab} className="mt-6 space-y-4">
          {filteredExchanges.map((ex) => (
            <ExchangeCard
              key={ex.exchange_id}
              exchange={ex}
              currentUserId={currentUserId}
              isLoading={actionLoading === ex.exchange_id}
              onAccept={handleAccept}
              onReject={handleReject}
              onCancel={handleCancel}
              onComplete={handleComplete}
              onCounteroffered={reloadExchanges}
            />
          ))}

          {filteredExchanges.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowLeftRight className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground mt-3">
                  No exchanges found with this filter.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
