"use client"

import { useState, useTransition } from "react"
import { Loader2, Mail } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EMAIL_PATTERN } from "@/lib/validation/email"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const normalized = email.trim().toLowerCase()
    if (!normalized) {
      setError("Email is required.")
      return
    }
    if (!EMAIL_PATTERN.test(normalized)) {
      setError("Please enter a valid email address.")
      return
    }

    startTransition(async () => {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalized }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Could not send recovery email.")
        return
      }
      router.push("/reset-password")
    })
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-xl p-6">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot password</CardTitle>
          <CardDescription>Enter your email and we will send you a 6-digit recovery code.</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleRequest} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fp-email">Email</Label>
              <Input
                id="fp-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isPending}
              />
            </div>

            <Button type="submit" disabled={isPending} className="w-full gap-2">
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send code
                </>
              )}
            </Button>

            <p className="text-sm text-muted-foreground text-center">
              Remembered your password?{" "}
              <Link href="/login" className="underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

