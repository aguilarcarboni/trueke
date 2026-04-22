"use client"
import { Exchanges } from '@/components/sections/exchanges/exchanges'
import { useSession } from 'next-auth/react'
import { Loader2 } from "lucide-react"

const page = () => {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex min-h-[40vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading" />
      </div>
    )
  }

  if (!session?.user?.id) {
    return null
  }

  return <Exchanges currentUserId={session.user.id} />
}

export default page