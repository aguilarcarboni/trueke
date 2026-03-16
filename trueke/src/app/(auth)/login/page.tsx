import SignIn from '@/components/auth/SignIn'
import { Suspense } from 'react'

const SignInPage = () => {
  return (
    <Suspense fallback={null}>
      <SignIn />
    </Suspense>
  )
}

export default SignInPage