"use client"

import { useState, useTransition } from "react"
import { Loader2, Mail, UserCheck } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EMAIL_PATTERN } from "@/lib/validation/email"

export default function ReactivateAccountPage() {
  const router = useRouter()

  // Step 1: enter email. Step 2: enter code.
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const normalized = email.trim().toLowerCase()
    if (!normalized || !EMAIL_PATTERN.test(normalized)) {
      setError("Please enter a valid email address.")
      return
    }
    startTransition(async () => {
      const res = await fetch("/api/account/reactivate-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalized }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Could not send reactivation email.")
        return
      }
      setStep(2)
    })
  }

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const cleanCode = code.replace(/\D/g, "").trim()
    if (!cleanCode) {
      setError("Verification code is required.")
      return
    }
    startTransition(async () => {
      const res = await fetch("/api/account/reactivate-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: cleanCode }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Could not reactivate account.")
        return
      }
      router.push("/login?reactivated=1")
    })
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-xl p-6">
        <CardHeader>
          <CardTitle className="text-2xl">Reactivate account</CardTitle>
          <CardDescription>
            {step === 1
              ? "Enter the email associated with your deactivated account and we will send you a 6-digit confirmation code."
              : `We sent a confirmation code to ${email}. Enter it below.`}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ra-email">Email</Label>
                <Input
                  id="ra-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={isPending}
                />
              </div>
              <Button type="submit" disabled={isPending} className="w-full gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {isPending ? "Sending…" : "Send code"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                <Link href="/login" className="underline">Back to login</Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ra-code">Verification code</Label>
                <Input
                  id="ra-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  disabled={isPending}
                />
              </div>
              <Button type="submit" disabled={isPending} className="w-full gap-2">
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                {isPending ? "Reactivating…" : "Reactivate account"}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                <button type="button" onClick={() => { setStep(1); setCode(""); setError(null) }} className="underline">
                  Resend code
                </button>
                {" · "}
                <Link href="/login" className="underline">Back to login</Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
