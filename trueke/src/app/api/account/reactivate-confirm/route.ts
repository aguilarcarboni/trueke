import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  runReactivationConfirm,
  REACTIVATION_CODE_COOKIE,
  REACTIVATION_EMAIL_COOKIE,
} from '@/lib/server/account-reactivation'

export async function POST(req: NextRequest) {
  let body: { code?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const storedCode = cookieStore.get(REACTIVATION_CODE_COOKIE)?.value
  const storedEmail = cookieStore.get(REACTIVATION_EMAIL_COOKIE)?.value

  const out = await runReactivationConfirm(body.code ?? '', storedCode, storedEmail)
  if (out.error) {
    return NextResponse.json({ error: out.error }, { status: 400 })
  }

  cookieStore.delete(REACTIVATION_CODE_COOKIE)
  cookieStore.delete(REACTIVATION_EMAIL_COOKIE)

  return NextResponse.json({ success: out.success })
}
