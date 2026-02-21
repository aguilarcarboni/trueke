"use client"

import { Gavel, Clock, Users, DollarSign, Package } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { auctions } from "@/lib/data"

const statusStyles: Record<string, string> = {
  upcoming: "bg-muted text-muted-foreground",
  active: "bg-success/10 text-success",
  selecting: "bg-warning/10 text-warning",
  closed: "bg-muted text-muted-foreground",
}

function getTimeRemaining(endTime: string) {
  const end = new Date(endTime).getTime()
  const now = new Date("2026-02-17T12:00:00Z").getTime()
  const diff = end - now
  if (diff <= 0) return "Ended"
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h remaining`
  return `${hours}h remaining`
}

function getAuctionProgress(startTime: string, endTime: string) {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const now = new Date("2026-02-17T12:00:00Z").getTime()
  if (now < start) return 0
  if (now > end) return 100
  return Math.round(((now - start) / (end - start)) * 100)
}

export function Auctions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auctions</h1>
          <p className="text-muted-foreground mt-1">Bid on items with money or your own items.</p>
        </div>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Gavel className="h-4 w-4" />
          Create Auction
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {auctions.map((auction) => {
          const highestBid = auction.bids
            .filter((b) => b.type === "monetary")
            .sort((a, b) => (b.amount || 0) - (a.amount || 0))[0]
          const itemBids = auction.bids.filter((b) => b.type === "item")
          const progress = getAuctionProgress(auction.startTime, auction.endTime)

          return (
            <Card key={auction.id} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="relative">
                <img
                  src={auction.item.images[0]}
                  alt={auction.item.title}
                  className="h-48 w-full object-cover"
                  crossOrigin="anonymous"
                />
                <Badge className={`absolute top-3 right-3 ${statusStyles[auction.status]} capitalize`}>
                  {auction.status}
                </Badge>
              </div>

              <CardContent className="pt-4 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground">{auction.item.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={auction.seller.avatar} alt={auction.seller.name} />
                      <AvatarFallback className="text-[10px]">{auction.seller.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">by {auction.seller.name}</span>
                  </div>
                </div>

                {/* Timer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {getTimeRemaining(auction.endTime)}
                    </span>
                    <span className="text-xs text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                <Separator />

                {/* Bids Summary */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Highest Bid</p>
                    {highestBid ? (
                      <p className="text-lg font-bold text-foreground">${highestBid.amount}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">No monetary bids</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Bids</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-1 text-sm text-foreground">
                        <DollarSign className="h-3.5 w-3.5" />
                        {auction.bids.filter(b => b.type === "monetary").length}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-foreground">
                        <Package className="h-3.5 w-3.5" />
                        {itemBids.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bidders */}
                {auction.bids.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Recent Bids</p>
                    {auction.bids.slice(0, 3).map((bid) => (
                      <div key={bid.id} className="flex items-center gap-3 rounded-lg bg-muted/50 p-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={bid.bidder.avatar} alt={bid.bidder.name} />
                          <AvatarFallback className="text-[10px]">{bid.bidder.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">{bid.bidder.name}</p>
                        </div>
                        {bid.type === "monetary" ? (
                          <Badge variant="secondary" className="text-xs">${bid.amount}</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs truncate max-w-28">{bid.itemOffered?.title}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {auction.status === "active" && (
                  <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Gavel className="h-4 w-4" />
                    Place Bid
                  </Button>
                )}
                {auction.status === "upcoming" && (
                  <Button variant="outline" className="w-full" disabled>
                    Starts {new Date(auction.startTime).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
