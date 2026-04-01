import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
  runPasswordReset,
  PASSWORD_RECOVERY_CODE_COOKIE,
  PASSWORD_RECOVERY_EMAIL_COOKIE,
} from '@/lib/server/password-recovery'

export async function POST(req: NextRequest) {
  let body: { code?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const storedCode = cookieStore.get(PASSWORD_RECOVERY_CODE_COOKIE)?.value
  const recoveryEmail = cookieStore.get(PASSWORD_RECOVERY_EMAIL_COOKIE)?.value

  const out = await runPasswordReset(
    body.code ?? '',
    body.password ?? '',
    storedCode,
    recoveryEmail
  )

  if (out.error) {
    return NextResponse.json({ error: out.error }, { status: 400 })
  }

  cookieStore.delete(PASSWORD_RECOVERY_CODE_COOKIE)
  cookieStore.delete(PASSWORD_RECOVERY_EMAIL_COOKIE)

  return NextResponse.json({ success: out.success })
}
