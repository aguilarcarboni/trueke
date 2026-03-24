"use client"

import { Badge } from "@/components/ui/badge"
import type { ExchangeItem } from "@/lib/entities/exchange"

// Placeholder for items without images
const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="%23e5e7eb" viewBox="0 0 200 200"%3E%3Crect width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dy=".3em" text-anchor="middle" fill="%236b7280" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E'

interface ExchangeItemListProps {
  label: string
  items: ExchangeItem[]
}

/**
 * Displays the list of items for one side of an exchange (offered / requested).
 * Single Responsibility: item thumbnail + title rendering only.
 * Satisfies AC1: shows actual item details instead of just counts.
 */
export function ExchangeItemList({ label, items }: ExchangeItemListProps) {
  if (items.length === 0) {
    return (
      <div>
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {label}:
        </span>
        <p className="text-sm text-muted-foreground italic">No items</p>
      </div>
    )
  }

  return (
    <div>
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
        {label}:
      </span>
      <div className="flex flex-wrap gap-2 mt-1.5">
        {items.map((item) => (
          <div
            key={item.item_id}
            className="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1.5"
          >
            <img
              src={item.images?.[0] || PLACEHOLDER_IMAGE}
              alt={item.title}
              className="h-8 w-8 rounded object-cover shrink-0"
              crossOrigin="anonymous"
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate max-w-[120px]">
                {item.title}
              </p>
              <Badge variant="outline" className="text-[10px] capitalize">
                {item.condition}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
