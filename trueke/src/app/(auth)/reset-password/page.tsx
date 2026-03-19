"use client"

import { useState, useTransition } from "react"
import { Loader2, Lock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { performPasswordReset } from "./actions"

const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[?!*&]).{8,}$/

export default function ResetPasswordPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const cleanCode = code.replace(/\D/g, "").trim()
    if (!cleanCode) {
      setError("Verification code is required.")
      return
    }

    if (!PASSWORD_PATTERN.test(newPassword)) {
      setError(
        "New password must be 8+ characters, include 1 uppercase letter, 1 number, and 1 special character (?, !, *, &).",
      )
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Confirm password does not match.")
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.append("code", cleanCode)
      formData.append("password", newPassword)

      const result = await performPasswordReset(formData)
      if (result.error) {
        setError(result.error)
        return
      }

      setSuccess(result.success ?? "Password updated successfully.")
      setTimeout(() => router.push("/login"), 1200)
    })
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-xl p-6">
        <CardHeader>
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>Enter the code and your new password.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-500/50 bg-green-500/10 text-green-800 dark:text-green-200 mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rp-code">Verification code</Label>
              <Input
                id="rp-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rp-new">New password</Label>
              <Input
                id="rp-new"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rp-confirm">Confirm new password</Label>
              <Input
                id="rp-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                disabled={isPending}
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full gap-2">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resetting…
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Reset password
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              <Link href="/login" className="underline">
                Back to login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

