"use client"

import { useState, useEffect } from "react"
import { ArrowLeftRight, Check, X, Clock, Users, Search, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { TradeProposalDialog } from "@/components/trade-proposal-dialog"
import { getAvailableItems, getUserExchanges } from "@/app/actions/exchange-actions"
import { useToast } from "@/hooks/use-toast"

// Temporary placeholder image for items without photos SHOULD BE REPLACED WITH A PROPER ASSET
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="%23e5e7eb" viewBox="0 0 200 200"%3E%3Crect width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dy=".3em" text-anchor="middle" fill="%236b7280" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'

interface Item {
  item_id: string
  title: string
  description: string
  category: string
  condition: string
  images: string[]
  owner_user_id: string
  owner_name?: string
  owner_avatar?: string
}

interface ExchangesProps {
  currentUserId: string
}

const statusStyles: Record<string, string> = {
  open: "bg-primary/10 text-primary border-primary/20",
  accepted: "bg-success/10 text-success border-success/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-muted text-muted-foreground border-border",
}

export function Exchanges({ currentUserId }: ExchangesProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")
  const [isSelectingItem, setIsSelectingItem] = useState(false)
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [userExchanges, setUserExchanges] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Get available items for marketplace
        const itemsResult = await getAvailableItems(currentUserId)
        console.log('getAvailableItems result:', itemsResult)
        
        if (itemsResult.success && itemsResult.data) {
          setAvailableItems(itemsResult.data)
        } else {
          console.warn('Failed to load available items:', itemsResult.error)
        }
        
        // Get user's exchanges
        const exchangesResult = await getUserExchanges(currentUserId)
        console.log('getUserExchanges result:', exchangesResult)
        
        if (exchangesResult.success && exchangesResult.data) {
          setUserExchanges(exchangesResult.data)
        } else {
          console.warn('Failed to load exchanges:', exchangesResult.error)
        }
      } catch (error) {
        console.error("Error loading exchanges:", error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load exchanges",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [currentUserId, toast])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const filteredExchanges = activeTab === "all"
    ? userExchanges
    : userExchanges.filter((e) => e.status === activeTab)

  // Filter items for selection based on search query
  const filteredAvailableItems = availableItems.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

  return (
    <div className="space-y-6">
      {/* Dialog for selecting item to trade */}
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
                        <Badge variant="outline" className="text-xs capitalize">{item.condition}</Badge>
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
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Exchanges</h1>
          <p className="text-muted-foreground mt-1">Manage your trade proposals and negotiations.</p>
        </div>
        <Button 
          onClick={() => setIsSelectingItem(true)}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ArrowLeftRight className="h-4 w-4" />
          New Trade
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({userExchanges.length})</TabsTrigger>
          <TabsTrigger value="pending">Open ({userExchanges.filter(e => e.status === "pending").length})</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {filteredExchanges.map((ex) => (
            <Card key={ex.exchange_id} className="transition-all hover:shadow-md">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-muted p-2">
                      <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-card-foreground">{ex.initiator_name}</p>
                        <Badge className={`text-xs border ${statusStyles[ex.status]}`}>
                          {ex.status}
                        </Badge>
                      </div>

                      {/* Items Count */}
                      <div className="mt-3 flex gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Offering:</span>
                          <p className="text-sm text-foreground">{ex.offered_count} item{ex.offered_count !== 1 ? 's' : ''}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Wants:</span>
                          <p className="text-sm text-foreground">{ex.requested_count} item{ex.requested_count !== 1 ? 's' : ''}</p>
                        </div>
                      </div>

                      {ex.message && (
                        <p className="text-sm text-muted-foreground mt-3 italic line-clamp-2">
                          "{ex.message}"
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        Created {new Date(ex.created_at).toLocaleDateString()}
                        {ex.expires_at && ` • Expires ${new Date(ex.expires_at).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {ex.status === "pending" && (
                      <>
                        <Button size="sm" variant="default" className="gap-1">
                          <Check className="h-4 w-4" />
                          Accept
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1">
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                    {ex.status !== "accepted" && ex.status !== "rejected" && (
                      <Button size="sm" variant="ghost" className="gap-1">
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredExchanges.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowLeftRight className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground mt-3">No exchanges found with this filter.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
