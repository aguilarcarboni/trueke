"use client"

import { useState, useEffect } from "react"
import { History, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExchangeItemList } from "@/components/sections/exchanges/exchange-item-list"
import { ExchangeStatusBadge } from "@/components/sections/exchanges/exchange-status-badge"
import { getExchangeHistory } from "@/app/actions/exchange"
import type { ExchangeHistoryEntry } from "@/lib/entities/exchange"

interface ExchangeHistoryProps {
  exchangeId: string
  parentExchangeId: string | null
}

/**
 * Displays the full chain of offers and counteroffers for an exchange (AC8).
 * Only renders when the exchange is part of a countered chain.
 */
export function ExchangeHistory({ exchangeId, parentExchangeId }: ExchangeHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [history, setHistory] = useState<ExchangeHistoryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)

  // Only show the toggle if this exchange is part of a chain
  if (!parentExchangeId) return null

  const loadHistory = async () => {
    if (loaded) {
      setIsOpen((prev) => !prev)
      return
    }

    setIsOpen(true)
    setIsLoading(true)
    const result = await getExchangeHistory(exchangeId)
    if (result.success && result.data) {
      setHistory(result.data)
    }
    setIsLoading(false)
    setLoaded(true)
  }

  return (
    <div className="mt-3">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        onClick={loadHistory}
      >
        <History className="h-3.5 w-3.5" />
        Negotiation History
        {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </Button>

      {isOpen && (
        <div className="mt-2 space-y-3 border-l-2 border-muted pl-4">
          {isLoading ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <p className="text-xs text-muted-foreground">No history available.</p>
          ) : (
            history.map((entry, index) => (
              <div
                key={entry.exchange_id}
                className={`rounded-md border p-3 space-y-2 ${
                  entry.exchange_id === exchangeId
                    ? "border-primary/30 bg-primary/5"
                    : "border-muted bg-muted/30"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {index === 0 ? "Original" : `Counteroffer #${index}`}
                  </span>
                  <ExchangeStatusBadge status={entry.status} />
                  {entry.exchange_id === exchangeId && (
                    <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-foreground">
                  <span className="font-semibold">{entry.initiator_name}</span> proposed:
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <ExchangeItemList label="Offering" items={entry.offered_items} />
                  <ExchangeItemList label="Requesting" items={entry.requested_items} />
                </div>
                {entry.message && (
                  <p className="text-xs text-muted-foreground italic">
                    &ldquo;{entry.message}&rdquo;
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  {new Date(entry.created_at).toLocaleDateString()} at{" "}
                  {new Date(entry.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
