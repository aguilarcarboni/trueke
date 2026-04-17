"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeftRight, ArrowUpRight, ArrowDownLeft, MessageSquare, Star } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExchangeStatusBadge } from "@/components/sections/exchanges/exchange-status-badge"
import { ExchangeItemList } from "@/components/sections/exchanges/exchange-item-list"
import { ExchangeActionButtons } from "@/components/sections/exchanges/exchange-action-buttons"
import { UserProfileDialog } from "@/components/sections/exchanges/user-profile-dialog"
import { ReviewDialog } from "@/components/sections/exchanges/review-dialog"
import { CounterOfferDialog } from "@/components/sections/exchanges/counteroffer-dialog"
import { ExchangeHistory } from "@/components/sections/exchanges/exchange-history"
import { hasUserReviewedExchange } from "@/app/actions/review"
import type { ExchangeListItemEnriched } from "@/lib/entities/exchange"

interface ExchangeCardProps {
  exchange: ExchangeListItemEnriched
  currentUserId: string
  isLoading: boolean
  onAccept: (exchangeId: string) => Promise<void>
  onReject: (exchangeId: string) => Promise<void>
  onCancel: (exchangeId: string) => Promise<void>
  onComplete: (exchangeId: string) => Promise<void>
  onCounteroffered?: () => void
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
  onComplete,
  onCounteroffered,
}: ExchangeCardProps) {
  const {
    exchange_id,
    initiator_id,
    initiator_name,
    target_name,
    status,
    message,
    created_at,
    expires_at,
    offered_items,
    requested_items,
  } = exchange

  const isSent = initiator_id === currentUserId
  const otherUserName = isSent ? target_name : initiator_name
  const otherUserId = isSent ? exchange.target_user_id : initiator_id

  const [profileOpen, setProfileOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [counterofferOpen, setCounterofferOpen] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)

  // Check if user already reviewed this completed exchange
  useEffect(() => {
    if (status !== "completed") return
    let cancelled = false
    async function check() {
      const result = await hasUserReviewedExchange(exchange_id, currentUserId)
      if (!cancelled && result.success) {
        setHasReviewed(result.data ?? false)
      }
    }
    check()
    return () => { cancelled = true }
  }, [status, exchange_id, currentUserId])

  // The items the current user RECEIVED (for condition reviews)
  const receivedItems = isSent ? requested_items : offered_items

  return (
    <>
    <UserProfileDialog
      userId={otherUserId}
      open={profileOpen}
      onOpenChange={setProfileOpen}
    />
    <ReviewDialog
      open={reviewOpen}
      onOpenChange={setReviewOpen}
      exchangeId={exchange_id}
      currentUserId={currentUserId}
      otherUserId={otherUserId}
      otherUserName={otherUserName}
      receivedItems={receivedItems}
      onSuccess={() => setHasReviewed(true)}
    />
    <CounterOfferDialog
      open={counterofferOpen}
      onOpenChange={setCounterofferOpen}
      exchange={exchange}
      currentUserId={currentUserId}
      onSuccess={onCounteroffered}
    />
    <Card className="transition-all hover:shadow-md">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: Exchange details */}
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="rounded-lg bg-muted p-2 shrink-0">
              <ArrowLeftRight className="h-6 w-6 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1 space-y-3">
              {/* Header: direction badge + other user + status */}
              <div className="flex flex-wrap items-center gap-2">
                {isSent ? (
                  <Badge variant="outline" className="gap-1 text-xs border-blue-300 text-blue-600 bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:bg-blue-950">
                    <ArrowUpRight className="h-3 w-3" />
                    Sent
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-xs border-amber-300 text-amber-600 bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:bg-amber-950">
                    <ArrowDownLeft className="h-3 w-3" />
                    Received
                  </Badge>
                )}
                <ExchangeStatusBadge status={status} />
              </div>

              {/* Other user (clickable) */}
              <p className="text-sm text-card-foreground">
                {isSent ? (
                  <>You proposed a trade to{" "}
                    <button
                      type="button"
                      onClick={() => setProfileOpen(true)}
                      className="font-semibold underline decoration-dotted underline-offset-2 hover:text-primary transition-colors cursor-pointer"
                    >
                      {otherUserName}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setProfileOpen(true)}
                      className="font-semibold underline decoration-dotted underline-offset-2 hover:text-primary transition-colors cursor-pointer"
                    >
                      {otherUserName}
                    </button>
                    {" "}proposed a trade to you
                  </>
                )}
              </p>

              {/* AC1: Show actual items offered and requested */}
              <div className="flex flex-col sm:flex-row gap-4">
                <ExchangeItemList label={isSent ? "You're offering" : "They're offering"} items={offered_items} />
                <ExchangeItemList label={isSent ? "You want" : "They want"} items={requested_items} />
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

              {/* AC8: Exchange history for counteroffer chains */}
              <ExchangeHistory
                exchangeId={exchange_id}
                parentExchangeId={exchange.parent_exchange_id}
              />
            </div>
          </div>

          {/* Right: Action buttons */}
          <div className="shrink-0 space-y-2">
            <Button asChild variant="outline" size="sm" className="w-full gap-2">
              <Link href={`/messages?exchangeId=${exchange_id}`}>
                <MessageSquare className="h-4 w-4" />
                Send a message
              </Link>
            </Button>
            {status === "completed" && !hasReviewed && (
              <Button
                size="sm"
                variant="default"
                className="w-full gap-2"
                onClick={() => setReviewOpen(true)}
              >
                <Star className="h-4 w-4" />
                Leave Review
              </Button>
            )}
            {status === "completed" && hasReviewed && (
              <Badge variant="outline" className="w-full justify-center py-1.5 text-xs bg-success/10 text-success border-success/20">
                Reviewed
              </Badge>
            )}
            <ExchangeActionButtons
              exchangeId={exchange_id}
              status={status}
              initiatorId={initiator_id}
              currentUserId={currentUserId}
              isLoading={isLoading}
              onAccept={onAccept}
              onReject={onReject}
              onCancel={onCancel}
              onComplete={onComplete}
              onCounteroffer={() => setCounterofferOpen(true)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  )
}
