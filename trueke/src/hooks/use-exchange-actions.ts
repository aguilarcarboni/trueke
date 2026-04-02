"use client"

import { useState, useCallback } from "react"
import { acceptExchange, rejectExchange, cancelExchange } from "@/app/actions/exchange"
import { useToast } from "@/hooks/use-toast"
import { getFriendlyErrorMessage } from "@/lib/error-messages"

/**
 * Encapsulates accept/reject/cancel logic + loading state.
 * Single Responsibility: action execution and feedback only.
 * Keeps the view layer free of business logic (AC4, AC5, AC7).
 */
export function useExchangeActions(
  currentUserId: string,
  onSuccess: () => Promise<void>
) {
  const { toast } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const handleAccept = useCallback(
    async (exchangeId: string) => {
      setActionLoading(exchangeId)
      try {
        const result = await acceptExchange({
          exchange_id: exchangeId,
          accepting_user_id: currentUserId,
        })
        if (result.success) {
          toast({
            title: "Trade accepted! 🤝",
            description: "The trade has been accepted. Both parties can now arrange the exchange.",
          })
          await onSuccess()
        } else {
          // AC6/AC7: friendly error shown (e.g. item no longer available)
          toast({
            title: "Couldn't accept trade",
            description: getFriendlyErrorMessage(result.error),
            variant: "destructive",
          })
        }
      } catch {
        // AC7: network / unexpected error
        toast({
          title: "Connection error",
          description: "We couldn't reach the server. Please try again.",
          variant: "destructive",
        })
      } finally {
        setActionLoading(null)
      }
    },
    [currentUserId, toast, onSuccess]
  )

  const handleReject = useCallback(
    async (exchangeId: string) => {
      setActionLoading(exchangeId)
      try {
        const result = await rejectExchange({
          exchange_id: exchangeId,
          rejecting_user_id: currentUserId,
        })
        if (result.success) {
          // AC5: confirmation toast
          toast({
            title: "Trade rejected",
            description: "The trade proposal has been rejected.",
          })
          await onSuccess()
        } else {
          toast({
            title: "Couldn't reject trade",
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
        setActionLoading(null)
      }
    },
    [currentUserId, toast, onSuccess]
  )

  const handleCancel = useCallback(
    async (exchangeId: string) => {
      setActionLoading(exchangeId)
      try {
        const result = await cancelExchange({
          exchange_id: exchangeId,
          initiator_user_id: currentUserId,
        })
        if (result.success) {
          toast({
            title: "Proposal cancelled",
            description: "Your trade proposal has been cancelled.",
          })
          await onSuccess()
        } else {
          toast({
            title: "Couldn't cancel proposal",
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
        setActionLoading(null)
      }
    },
    [currentUserId, toast, onSuccess]
  )

  return { actionLoading, handleAccept, handleReject, handleCancel }
}
