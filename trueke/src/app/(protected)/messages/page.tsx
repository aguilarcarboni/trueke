"use client"

import { useSession } from "next-auth/react"
import { Messages } from "@/components/sections/messages/messages"

const Page = () => {
  const { data: session } = useSession()

  if (!session?.user?.id) {
    return null
  }

  return <Messages currentUserId={session.user.id} />
}

export default Page
