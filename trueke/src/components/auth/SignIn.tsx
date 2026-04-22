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
  const [isRecoverable, setIsRecoverable] = useState(false);
  
  const router = useRouter();

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const reactivated = searchParams.get('reactivated') === '1';

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
      callbackUrl: callbackUrl ?? '/',
    });

    if (result?.error) {
      setIsRecoverable(result.error === 'AccountDeactivatedRecoverable')
      const messages: Record<string, string> = {
        AccountDeactivatedRecoverable: 'Your account is deactivated. You can reactivate it within 30 days.',
        AccountDeactivated: 'This account has been permanently deactivated. Please contact support.',
      }
      toast({ title: 'Error', description: messages[result.error] ?? 'Invalid email or password.', variant: 'destructive' })
    }

    setIsLoading(false);
  }

  return (
    <Card className='w-full max-w-xl p-8'>
      <CardHeader className='flex flex-col justify-center items-center gap-2'>
        <CardTitle className='text-center font-bold text-3xl'>Sign in</CardTitle>
      </CardHeader>
      <CardContent className='w-full flex flex-col gap-5'>
        {reactivated && (
          <Alert className="border-green-500/50 bg-green-500/10 text-green-800 dark:text-green-200">
            <AlertDescription>Your account has been reactivated. You can now sign in.</AlertDescription>
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
          {isRecoverable && (
            <>
              {' · '}
              <Link href={'/reactivate-account'} className='underline'>
                Reactivate account
              </Link>
            </>
          )}
        </p>
        <p className='text-sm text-center text-red-500'>No account? <Link href={'/register'} className='underline text-primary font-bold'>Register</Link></p>
      </CardContent>
    </Card>
  )
}

export default SignIn;