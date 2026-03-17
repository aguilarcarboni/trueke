'use client'

import { useSession, signOut } from "next-auth/react"
import { Button } from '../ui/button'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const Account = () => {

  const { data: session } = useSession()
  const callbackUrl = typeof window !== 'undefined' ? window.location.pathname : '/'
  if (!session?.user) return null;
  
  return (
    <div className='h-fit w-fit flex flex-col justify-center items-center'>
        {session?.user && (
          <Popover>
            <PopoverTrigger asChild className='w-fit h-full'>
              <Button variant='ghost' className='flex flex-col hover:bg-muted gap-y-5 w-full h-full hover:bg-agm-black/5 hover:text-foreground'>
                <div className='flex w-full text-agm-dark-blue h-full items-center gap-x-5'>
                  <div className='w-10 h-10 rounded-full bg-primary'></div>
                  <p className='text-xs text-nowrap'>Account</p>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full h-full flex justify-center items-center">
              <Button onClick={() => signOut({callbackUrl: '/'}) } className="flex">
                  <p className="text-sm">Sign out</p>
              </Button>
                  <Button onClick={() => {} } className="flex">
                  <p className="text-sm">Settings</p>
              </Button>
            </PopoverContent>
          </Popover>
        )}
    </div>
  )
}

export default Account