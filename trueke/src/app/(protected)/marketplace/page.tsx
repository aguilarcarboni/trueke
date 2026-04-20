"use client"

import { Marketplace } from '@/components/sections/marketplace/marketplace'
import { useSession } from 'next-auth/react'

const page = () => {
  const { data: session } = useSession()
  if (!session?.user?.id) return null

  return (
    <Marketplace currentUserId={session.user.id} />
  )
}

export default page