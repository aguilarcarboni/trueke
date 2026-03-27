import { unstable_noStore } from 'next/cache'
import { cookies, headers } from 'next/headers'
import type { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { getToken } from 'next-auth/jwt'
import { authOptions } from '@/utils/auth'

/**
 * Who is logged in? Read from the NextAuth session cookie (JWT), not a custom `user_id` cookie.
 *
 * - `getServerSession` / `getToken` decrypt the cookie using NEXTAUTH_SECRET.
 * - `token.sub` matches what you set in the JWT callback (`user.id` / `dbUser.user_id`).
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  unstable_noStore()

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) {
    console.error('[auth] Set NEXTAUTH_SECRET (or AUTH_SECRET) in .env.local')
    return null
  }

  const session = await getServerSession(authOptions)
  const fromSession = session?.user?.id?.trim()
  if (fromSession) return fromSession

  const cookieStore = await cookies()
  const headerList = await headers()
  const headersObj = Object.fromEntries(headerList.entries())

  const token =
    (await getToken({
      req: { headers: headersObj, cookies: cookieStore } as any,
      secret,
      secureCookie: false,
    })) ??
    (await getToken({
      req: { headers: headersObj, cookies: cookieStore } as any,
      secret,
      secureCookie: true,
    }))

  return subFromToken(token)
}

function subFromToken(token: Awaited<ReturnType<typeof getToken>>): string | null {
  const sub = token?.sub
  return typeof sub === 'string' && sub.trim() ? sub.trim() : null
}

/** Use in Route Handlers where you have a real `NextRequest`. */
export async function getAuthenticatedUserIdFromNextRequest(req: NextRequest): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
  if (!secret) return null

  const tryToken = async (r: Parameters<typeof getToken>[0]['req']) =>
    (await getToken({ req: r, secret, secureCookie: false } as any)) ??
    (await getToken({ req: r, secret, secureCookie: true } as any))

  // 1) NextRequest (works in most setups)
  let t = await tryToken(req as any)
  let id = subFromToken(t)
  if (id) return id

  // 2) Cookie header only — some Next.js builds expose cookies more reliably here
  const cookieHeader = req.headers.get('cookie') ?? ''
  if (cookieHeader) {
    t = await tryToken({ headers: { cookie: cookieHeader } } as any)
    id = subFromToken(t)
    if (id) return id
  }

  // 3) Same request via next/headers (Route Handlers share this with the incoming request)
  const fromSession = await getServerSession(authOptions)
  const sid = fromSession?.user?.id?.trim()
  if (sid) return sid

  return getAuthenticatedUserId()
}
