"use client"
import { Exchanges } from '@/components/sections/exchanges/exchanges'
import { useSession } from 'next-auth/react'

const page = () => {

  const { data: session } = useSession()

  if (!session) {
    return null
  }
  
  return (
    <Exchanges currentUserId={session?.user.id} />
  )
}

export default page