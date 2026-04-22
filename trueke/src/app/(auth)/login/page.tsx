import SignIn from '@/components/auth/SignIn'
import { Suspense } from 'react'

const SignInPage = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <Suspense fallback={null}>
        <SignIn />
      </Suspense>
    </div>
  )
}

export default SignInPage
