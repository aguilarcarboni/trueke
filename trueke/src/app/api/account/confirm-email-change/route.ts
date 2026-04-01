import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthenticatedUserIdFromNextRequest } from '@/utils/auth-server'
import { runConfirmEmailChange } from '@/lib/server/change-email'

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserIdFromNextRequest(req)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const storedCode = cookieStore.get('verification_code')?.value
  const pendingNewEmail = cookieStore.get('pending_new_email')?.value

  const out = await runConfirmEmailChange(userId, body.code ?? '', storedCode, pendingNewEmail)
  if (out.error) {
    return NextResponse.json({ error: out.error }, { status: 400 })
  }

  cookieStore.delete('verification_code')
  cookieStore.delete('pending_new_email')

  return NextResponse.json({ success: out.success })
}
