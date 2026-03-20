import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthenticatedUserIdFromNextRequest } from '@/utils/auth-server'
import { runChangeEmailRequest } from '@/lib/server/change-email'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 60 * 5,
  path: '/',
}

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserIdFromNextRequest(req)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  let body: { currentPassword?: string; newEmail?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const result = await runChangeEmailRequest(userId, body.currentPassword ?? '', body.newEmail ?? '')
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  const cookieStore = await cookies()
  cookieStore.set('verification_code', result.code, COOKIE_OPTS)
  cookieStore.set('pending_new_email', result.pendingEmail, COOKIE_OPTS)

  return NextResponse.json({ success: result.success })
}
