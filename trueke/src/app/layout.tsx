'use client'
import "./globals.css"
import { Inter } from 'next/font/google'
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { NextAuthProvider } from "@/utils/providers/NextAuthProvider"

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {

  return (
    <html lang="en" className={cn(inter.className, "h-screen bg-background scrollbar-hide select-none w-screen")}>
      <body className='h-full w-full'> 
        <NextAuthProvider>
          {children}
          <Toaster />
        </NextAuthProvider>
      </body>
    </html>
  )
}