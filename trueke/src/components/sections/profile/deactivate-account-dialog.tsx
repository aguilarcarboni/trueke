"use client"

import { useState, useTransition } from "react"
import { signOut } from "next-auth/react"
import { TriangleAlert } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DeactivateAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeactivateAccountDialog({ open, onOpenChange }: DeactivateAccountDialogProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const reset = () => {
    setPassword("")
    setError(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!password.trim()) {
      setError("Please enter your password to confirm.")
      return
    }

    startTransition(async () => {
      const res = await fetch("/api/account/deactivate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }
      await signOut({ callbackUrl: "/login" })
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <TriangleAlert className="h-5 w-5" />
            Deactivate account
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          This action will deactivate your account. All your listings will be deleted and you trades will be cancelled, please make sure you want to continue. 
          Enter your current password to confirm.
          
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="deactivate-password">Password</Label>
            <PasswordInput
              id="deactivate-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isPending}
              autoComplete="current-password"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending || !password.trim()}>
              {isPending ? "Deactivating…" : "Deactivate account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
