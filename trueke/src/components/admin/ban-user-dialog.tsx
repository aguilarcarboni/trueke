"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const BAN_DURATIONS = [
  { label: "3 days",    value: "3d" },
  { label: "7 days",    value: "7d" },
  { label: "30 days",   value: "30d" },
  { label: "3 months",  value: "3m" },
  { label: "Permanent", value: "permanent" },
]

export function banExpiresAt(value: string): Date {
  const d = new Date()
  if (value === "permanent") { d.setFullYear(9999); return d }
  if (value === "3d")  { d.setDate(d.getDate() + 3);   return d }
  if (value === "7d")  { d.setDate(d.getDate() + 7);   return d }
  if (value === "30d") { d.setDate(d.getDate() + 30);  return d }
  if (value === "3m")  { d.setMonth(d.getMonth() + 3); return d }
  return d
}

interface BanUserDialogProps {
  username: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (duration: string, expiresAt: Date, reason: string) => void
}

export function BanUserDialog({ username, open, onOpenChange, onConfirm }: BanUserDialogProps) {
  const [duration, setDuration] = useState("")
  const [reason, setReason] = useState("")

  function handleConfirm() {
    if (!duration) return
    onConfirm(duration, banExpiresAt(duration), reason.trim())
    setDuration("")
    setReason("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ban <span className="font-semibold">{username}</span></DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ban-duration">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger id="ban-duration">
                <SelectValue placeholder="Select a duration" />
              </SelectTrigger>
              <SelectContent>
                {BAN_DURATIONS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ban-reason">Reason <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              id="ban-reason"
              placeholder="Describe why this user is being banned…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={handleConfirm} disabled={!duration}>
            Ban user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
