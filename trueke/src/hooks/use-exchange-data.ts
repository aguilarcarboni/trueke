"use client"

import { useState, useEffect, useCallback } from "react"
import { getUserExchangesEnriched, getAvailableItems } from "@/app/actions/exchange"
import { useToast } from "@/hooks/use-toast"
import { getFriendlyErrorMessage } from "@/lib/error-messages"
import type { ExchangeListItemEnriched } from "@/lib/entities/exchange"
import type { Item } from "@/lib/entities/item"

/**
 * Encapsulates all data-fetching logic for the Exchanges view.
 * Single Responsibility: loading + caching exchange data.
 * Dependency Inversion: components depend on this abstraction, not on server actions directly.
 */
export function useExchangeData(currentUserId: string) {
  const { toast } = useToast()
  const [exchanges, setExchanges] = useState<ExchangeListItemEnriched[]>([])
  const [availableItems, setAvailableItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [exchangesResult, itemsResult] = await Promise.all([
        getUserExchangesEnriched(currentUserId),
        getAvailableItems(currentUserId),
      ])

      if (exchangesResult.success && exchangesResult.data) {
        setExchanges(exchangesResult.data)
      } else {
        toast({
          title: "Couldn't load your exchanges",
          description: getFriendlyErrorMessage(exchangesResult.error),
          variant: "destructive",
        })
      }

      if (itemsResult.success && itemsResult.data) {
        setAvailableItems(itemsResult.data)
      } else {
        toast({
          title: "Couldn't load marketplace items",
          description: getFriendlyErrorMessage(itemsResult.error),
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Connection error",
        description: "We couldn't reach the server. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentUserId, toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  /** Reload only exchanges (after an action). */
  const reloadExchanges = useCallback(async () => {
    const result = await getUserExchangesEnriched(currentUserId)
    if (result.success && result.data) {
      setExchanges(result.data)
    }
  }, [currentUserId])

  return { exchanges, availableItems, isLoading, reloadExchanges }
}
