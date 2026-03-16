import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  children?: React.ReactNode
}

const LoadingComponent = ({className, children}: Props) => {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      <Loader2 className='text-primary animate-spin' />
      {children}
    </div>
  )
}

export default LoadingComponent
