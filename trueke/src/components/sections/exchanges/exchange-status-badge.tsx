"use client"

import { Badge } from "@/components/ui/badge"
import {
  getExchangeStatusLabel,
  getExchangeStatusStyle,
} from "@/lib/entities/exchange"
import type { ExchangeStatus } from "@/lib/entities/exchange"

interface ExchangeStatusBadgeProps {
  status: ExchangeStatus
  className?: string
}

/**
 * Single-responsibility component: renders a styled badge for an exchange status.
 * Uses centralized label/style maps from the exchange entity (no duplication).
 */
export function ExchangeStatusBadge({ status, className }: ExchangeStatusBadgeProps) {
  return (
    <Badge className={`text-xs border ${getExchangeStatusStyle(status)} ${className ?? ""}`}>
      {getExchangeStatusLabel(status)}
    </Badge>
  )
}
