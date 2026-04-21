import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  runReactivationRequest,
  REACTIVATION_CODE_COOKIE,
  REACTIVATION_EMAIL_COOKIE,
} from '@/lib/server/account-reactivation'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 5,
  path: '/',
}

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const result = await runReactivationRequest(body.email ?? '')
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set(REACTIVATION_CODE_COOKIE, result.code, COOKIE_OPTS)
  cookieStore.set(REACTIVATION_EMAIL_COOKIE, result.normalizedEmail, COOKIE_OPTS)

  return NextResponse.json({ success: 'Reactivation code sent to your email.' })
}
