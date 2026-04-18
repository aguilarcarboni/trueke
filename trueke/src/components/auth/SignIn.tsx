"use client";
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Card, CardContent, CardTitle, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import LoaderButton from '../misc/LoaderButton';

function SignIn() {

  const { data: session } = useSession()

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);
  
  const router = useRouter();

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const {toast} = useToast()

  if (session) {
    router.push(callbackUrl ? callbackUrl : '/');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

  const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: callbackUrl ? callbackUrl : '/',
    });

    if (result?.error) {
      if (result.error === 'AccountDeactivated') {
        setIsDeactivated(true)
      } else {
        setIsDeactivated(false)
        toast({
          title: 'Error',
          description: 'Invalid email or password.',
          variant: 'destructive'
        })
      }
    }

    setIsLoading(false);
  }

  return (
    <Card className='w-full max-w-xl p-8'>
      <CardHeader className='flex flex-col justify-center items-center gap-2'>
        <CardTitle className='text-center font-bold text-3xl'>Sign in</CardTitle>
      </CardHeader>
      <CardContent className='w-full flex flex-col gap-5'>
        {isDeactivated && (
          <Alert variant="destructive">
            <AlertDescription>
              This account has been deactivated. Please contact support if you believe this is a mistake.
            </AlertDescription>
          </Alert>
        )}
        <form onSubmit={handleSubmit} className='flex flex-col gap-4 w-full'>
          <Input
            type="text"
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
          <PasswordInput
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="current-password"
          />
          <LoaderButton isLoading={isLoading} text='Sign in' />
        </form>
        <p className='text-sm text-center text-muted-foreground'>
          <Link href={'/forgot-password'} className='underline'>
            Forgot password?
          </Link>
        </p>
        <p className='text-sm text-center text-red-500'>No account? <Link href={'/register'} className='underline text-primary font-bold'>Register</Link></p>
      </CardContent>
    </Card>
  )
}

export default SignIn;