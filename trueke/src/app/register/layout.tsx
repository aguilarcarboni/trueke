import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Register - Trueke',
  description: 'Create your Trueke account',
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
