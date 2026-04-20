import { Loader2 } from 'lucide-react'
import React from 'react'
import { Button } from '../ui/button'

type Props = {
    isLoading: boolean,
    text: string,
    className?: string,
    onClick?: () => void,
    disabled?: boolean,
    type?: 'submit' | 'button' | 'reset'
}

const LoaderButton = ({isLoading, text, className, onClick, disabled, type = 'submit'}: Props) => {
  return (
    <Button type={type} className={className} disabled={isLoading || disabled} onClick={onClick}>
        {isLoading ? (
        <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {text}
        </>
        ) : (
            text
        )}
  </Button>
  )
}

export default LoaderButton