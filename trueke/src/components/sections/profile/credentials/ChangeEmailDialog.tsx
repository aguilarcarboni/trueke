"use client"

import { useState, useTransition } from "react"
import { Loader2, Mail } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Step = "request" | "confirm"

interface ChangeEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentEmail: string
  onSuccess?: () => void
}

export function ChangeEmailDialog({
  open,
  onOpenChange,
  currentEmail,
  onSuccess,
}: ChangeEmailDialogProps) {
  const [step, setStep] = useState<Step>("request")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const reset = () => {
    setStep("request")
    setCurrentPassword("")
    setNewEmail("")
    setVerificationCode("")
    setError(null)
    setSuccess(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) reset()
    onOpenChange(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (step === "request") {
      if (!currentPassword.trim()) {
        setError("Current password is required.")
        return
      }
      const trimmed = newEmail.trim().toLowerCase()
      if (!trimmed) {
        setError("New email is required.")
        return
      }
      if (!EMAIL_PATTERN.test(trimmed)) {
        setError("Please provide a valid email address.")
        return
      }

      startTransition(async () => {
        const res = await fetch("/api/account/change-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ currentPassword, newEmail: trimmed }),
        })
        const data = (await res.json()) as { error?: string; success?: string }
        if (!res.ok) {
          setError(data.error ?? "Could not start email change.")
          return
        }
        setSuccess(data.success ?? "Verification code sent.")
        setStep("confirm")
        setCurrentPassword("")
        setVerificationCode("")
      })
      return
    }

    // confirm step
    startTransition(async () => {
      const code = verificationCode.replace(/\D/g, "").trim()
      if (!code) {
        setError("Verification code is required.")
        return
      }
      const res = await fetch("/api/account/confirm-email-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      })
      const data = (await res.json()) as { error?: string; success?: string }
      if (!res.ok) {
        setError(data.error ?? "Could not confirm email.")
        return
      }
      setSuccess(data.success ?? "Email updated successfully.")
      reset()
      onSuccess?.()
      setTimeout(() => handleOpenChange(false), 500)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Change email
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-500/50 bg-green-500/10 text-green-800 dark:text-green-200">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {step === "request" && (
            <>
              <p className="text-sm text-muted-foreground">
                Current email: <span className="font-medium text-foreground">{currentEmail}</span>
              </p>

              <div className="space-y-2">
                <Label htmlFor="ce-current">Current password (verification)</Label>
                <PasswordInput
                  id="ce-current"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ce-new">New email</Label>
                <Input
                  id="ce-new"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </>
          )}

          {step === "confirm" && (
            <>
              <p className="text-sm text-muted-foreground">
                Enter the verification code we sent to your new email.
              </p>

              <div className="space-y-2">
                <Label htmlFor="ce-code">Verification code</Label>
                <Input
                  id="ce-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                />
              </div>
            </>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {step === "request" ? "Sending…" : "Confirming…"}
                </>
              ) : step === "request" ? (
                "Send code"
              ) : (
                "Confirm email"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

