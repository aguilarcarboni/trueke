"use client"

import { Gavel } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Auctions() {
  return (
    <div className="flex min-h-full w-full flex-1 flex-col space-y-6">
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
      </div>
    </div>
  )
}
