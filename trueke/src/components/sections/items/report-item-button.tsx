"use client"

import { useState } from "react"
import { Flag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ReportItemDialog } from "@/components/sections/items/report-item-dialog"

interface ReportItemButtonProps {
  itemId: string
  itemTitle?: string
  alreadyReported?: boolean
}

export function ReportItemButton({ itemId, itemTitle, alreadyReported = false }: ReportItemButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Separator />
      <Button
        variant="ghost"
        className="w-full gap-2 text-muted-foreground text-sm"
        onClick={() => !alreadyReported && setOpen(true)}
        disabled={alreadyReported}
        title={alreadyReported ? "You have already reported this item" : undefined}
      >
        <Flag className="h-4 w-4" />
        {alreadyReported ? "Already Reported" : "Report Item"}
      </Button>
      <ReportItemDialog
        open={open}
        onOpenChange={setOpen}
        itemId={itemId}
        itemTitle={itemTitle}
      />
    </>
  )
}
