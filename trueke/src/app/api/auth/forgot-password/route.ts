import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  runForgotPassword,
  PASSWORD_RECOVERY_CODE_COOKIE,
  PASSWORD_RECOVERY_EMAIL_COOKIE,
} from '@/lib/server/password-recovery'

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

  const result = await runForgotPassword(body.email ?? '')
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set(PASSWORD_RECOVERY_CODE_COOKIE, result.code, COOKIE_OPTS)
  cookieStore.set(PASSWORD_RECOVERY_EMAIL_COOKIE, result.normalizedEmail, COOKIE_OPTS)

  return NextResponse.json({ success: 'Recovery code sent to your email.' })
}
