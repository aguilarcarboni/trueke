import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserIdFromNextRequest } from '@/utils/auth-server'
import { runChangePassword } from '@/lib/server/run-change-password'

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserIdFromNextRequest(req)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  let body: { currentPassword?: string; newPassword?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const result = await runChangePassword(userId, body.currentPassword ?? '', body.newPassword ?? '')
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
