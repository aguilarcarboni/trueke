import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Trueke',
  description: 'Administrative panel for moderating and managing the Trueke marketplace platform.',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
