"use client"

import { useState } from "react"
import { Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmActionDialog } from "@/components/sections/exchanges/confirm-action-dialog"
import type { ExchangeStatus } from "@/lib/entities/exchange"

interface ExchangeActionButtonsProps {
  exchangeId: string
  status: ExchangeStatus
  initiatorId: string
  currentUserId: string
  isLoading: boolean
  onAccept: (exchangeId: string) => Promise<void>
  onReject: (exchangeId: string) => Promise<void>
  onCancel: (exchangeId: string) => Promise<void>
}

/**
 * Renders the appropriate action buttons for an exchange card.
 *
 * AC2: Accept/Reject only visible to the target user (not initiator).
 * AC3: No buttons when status !== 'pending'; status is shown by ExchangeStatusBadge.
 * AC4/AC5: Confirmation dialogs before accept/reject.
 */
export function ExchangeActionButtons({
  exchangeId,
  status,
  initiatorId,
  currentUserId,
  isLoading,
  onAccept,
  onReject,
  onCancel,
}: ExchangeActionButtonsProps) {
  const [confirmAction, setConfirmAction] = useState<"accept" | "reject" | "cancel" | null>(null)

  // AC3: Only show buttons for pending exchanges
  if (status !== "pending") return null

  const isInitiator = initiatorId === currentUserId

  const handleConfirm = async () => {
    if (confirmAction === "accept") await onAccept(exchangeId)
    if (confirmAction === "reject") await onReject(exchangeId)
    if (confirmAction === "cancel") await onCancel(exchangeId)
    setConfirmAction(null)
  }

  const dialogConfig = {
    accept: {
      title: "Accept this trade?",
      description:
        "Are you sure you want to accept this trade proposal? Both parties will be able to arrange the exchange.",
      confirmLabel: "Accept Trade",
      variant: "default" as const,
    },
    reject: {
      title: "Reject this trade?",
      description:
        "Are you sure you want to reject this trade proposal? This action cannot be undone.",
      confirmLabel: "Reject Trade",
      variant: "destructive" as const,
    },
    cancel: {
      title: "Cancel your proposal?",
      description:
        "Are you sure you want to cancel this trade proposal? The other user will be notified.",
      confirmLabel: "Cancel Proposal",
      variant: "destructive" as const,
    },
  }

  return (
    <>
      <div className="flex gap-2">
        {/* AC2: Accept/Reject only for the target (non-initiator) */}
        {!isInitiator && (
          <>
            <Button
              size="sm"
              variant="default"
              className="gap-1"
              disabled={isLoading}
              onClick={() => setConfirmAction("accept")}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={isLoading}
              onClick={() => setConfirmAction("reject")}
            >
              <X className="h-4 w-4" />
              Reject
            </Button>
          </>
        )}

        {/* Only the initiator can cancel */}
        {isInitiator && (
          <Button
            size="sm"
            variant="ghost"
            className="gap-1"
            disabled={isLoading}
            onClick={() => setConfirmAction("cancel")}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
            Cancel
          </Button>
        )}
      </div>

      {/* Confirmation Dialog (AC4/AC5) */}
      {confirmAction && (
        <ConfirmActionDialog
          open={!!confirmAction}
          onOpenChange={(open) => {
            if (!open) setConfirmAction(null)
          }}
          title={dialogConfig[confirmAction].title}
          description={dialogConfig[confirmAction].description}
          confirmLabel={dialogConfig[confirmAction].confirmLabel}
          variant={dialogConfig[confirmAction].variant}
          isLoading={isLoading}
          onConfirm={handleConfirm}
        />
      )}
    </>
  )
}
