import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Login - Trueke',
  description: 'Sign in to your Trueke account',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
