import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trueke - Barter, Exchange & Auction Marketplace',
  description: 'A modern marketplace for bartering, exchanging, and auctioning items and services.',
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
