"use client"

import { ArrowLeftRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { ExchangeStatusBadge } from "@/components/sections/exchanges/exchange-status-badge"
import { ExchangeItemList } from "@/components/sections/exchanges/exchange-item-list"
import { ExchangeActionButtons } from "@/components/sections/exchanges/exchange-action-buttons"
import type { ExchangeListItemEnriched } from "@/lib/entities/exchange"

interface ExchangeCardProps {
  exchange: ExchangeListItemEnriched
  currentUserId: string
  isLoading: boolean
  onAccept: (exchangeId: string) => Promise<void>
  onReject: (exchangeId: string) => Promise<void>
  onCancel: (exchangeId: string) => Promise<void>
}

/**
 * Displays a single exchange proposal card with full details.
 *
 * AC1: Shows offered items, requested items, sender message, and expiration.
 * AC2/AC3: Delegates button visibility logic to ExchangeActionButtons.
 * Follows Single Responsibility: rendering one exchange card only.
 */
export function ExchangeCard({
  exchange,
  currentUserId,
  isLoading,
  onAccept,
  onReject,
  onCancel,
}: ExchangeCardProps) {
  const {
    exchange_id,
    initiator_id,
    initiator_name,
    status,
    message,
    created_at,
    expires_at,
    offered_items,
    requested_items,
  } = exchange

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Exchange details */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="rounded-lg bg-muted p-2 shrink-0">
              <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              {/* Header: initiator name + status badge */}
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-card-foreground">{initiator_name}</p>
                <ExchangeStatusBadge status={status} />
              </div>

              {/* AC1: Show actual items offered and requested */}
              <div className="flex flex-col sm:flex-row gap-4">
                <ExchangeItemList label="Offering" items={offered_items} />
                <ExchangeItemList label="Wants" items={requested_items} />
              </div>

              {/* AC1: Sender message */}
              {message && (
                <p className="text-sm text-muted-foreground italic line-clamp-2">
                  &ldquo;{message}&rdquo;
                </p>
              )}

              {/* AC1: Dates */}
              <p className="text-xs text-muted-foreground">
                Created {new Date(created_at).toLocaleDateString()}
                {expires_at && ` · Expires ${new Date(expires_at).toLocaleDateString()}`}
              </p>
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="shrink-0">
            <ExchangeActionButtons
              exchangeId={exchange_id}
              status={status}
              initiatorId={initiator_id}
              currentUserId={currentUserId}
              isLoading={isLoading}
              onAccept={onAccept}
              onReject={onReject}
              onCancel={onCancel}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
