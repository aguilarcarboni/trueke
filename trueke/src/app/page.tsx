'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRedirectPath } from './get-redirect-path'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    getRedirectPath().then((path) => {
      router.replace(path)
    })
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  )
}
