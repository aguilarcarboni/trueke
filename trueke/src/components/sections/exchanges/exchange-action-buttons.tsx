"use client"

import { useState } from "react"
import { Check, CheckCircle2, Loader2, X, ArrowLeftRight } from "lucide-react"
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
  onComplete: (exchangeId: string) => Promise<void>
  onCounteroffer?: () => void
}

type ConfirmKind = "accept" | "reject" | "cancel" | "cancel_accepted" | "complete" | null

/**
 * Renders the appropriate action buttons for an exchange card.
 *
 * Pending: accept/reject (target), cancel proposal (initiator).
 * Accepted: mark complete (any participant), cancel trade (any participant).
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
  onComplete,
  onCounteroffer,
}: ExchangeActionButtonsProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmKind>(null)

  if (
    status === "completed" ||
    status === "rejected" ||
    status === "expired" ||
    status === "cancelled" ||
    status === "countered"
  ) {
    return null
  }

  const isInitiator = initiatorId === currentUserId

  const handleConfirm = async () => {
    if (confirmAction === "accept") await onAccept(exchangeId)
    if (confirmAction === "reject") await onReject(exchangeId)
    if (confirmAction === "cancel" || confirmAction === "cancel_accepted") await onCancel(exchangeId)
    if (confirmAction === "complete") await onComplete(exchangeId)
    setConfirmAction(null)
  }

  const dialogConfig = {
    accept: {
      title: "Accept this trade?",
      description:
        "Are you sure you want to accept this trade proposal? Items will be reserved for this exchange until it is completed or cancelled.",
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
    cancel_accepted: {
      title: "Cancel this accepted trade?",
      description:
        "The items will be released and become available for other trades again. The other user will be notified.",
      confirmLabel: "Cancel Trade",
      variant: "destructive" as const,
    },
    complete: {
      title: "Mark trade as complete?",
      description:
        "Confirm that the physical or digital exchange is done. All items in this trade will be marked as traded.",
      confirmLabel: "Mark Complete",
      variant: "default" as const,
    },
  }

  if (status === "accepted") {
    return (
      <>
        <div className="flex flex-col gap-2">
          <Button
            size="sm"
            variant="default"
            className="w-full gap-1 justify-center"
            disabled={isLoading}
            onClick={() => setConfirmAction("complete")}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Mark complete
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="w-full gap-1 justify-center border-destructive/40 text-destructive hover:bg-destructive/10"
            disabled={isLoading}
            onClick={() => setConfirmAction("cancel_accepted")}
          >
            <X className="h-4 w-4" />
            Cancel trade
          </Button>
        </div>

        {confirmAction && (
          <ConfirmActionDialog
            open={!!confirmAction}
            onOpenChange={(open) => {
              if (!open) setConfirmAction(null);
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
    );
  }

  // pending
  if (status !== "pending") return null

  return (
    <>
      <div className="flex gap-2">
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
              className="gap-1 border-amber-400 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
              disabled={isLoading}
              onClick={onCounteroffer}
            >
              <ArrowLeftRight className="h-4 w-4" />
              Counteroffer
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
