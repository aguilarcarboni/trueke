import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { passwordsMatch } from '@/lib/server/account/user-password'
import { handleUserStatusChange } from '@/lib/server/handle-user-status-change'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body.email?.trim() || !body.password?.trim()) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: user, error: fetchError } = await supabase
    .from('user')
    .select('user_id, password_hash, status, deactivated_at')
    .eq('email', body.email.trim().toLowerCase())
    .single()

  if (fetchError || !user) {
    return NextResponse.json({ error: 'Account not found.' }, { status: 404 })
  }

  if (user.status !== 'inactive') {
    return NextResponse.json({ error: 'This account is not deactivated.' }, { status: 400 })
  }

  const deactivatedAt = user.deactivated_at ? new Date(user.deactivated_at).getTime() : null
  if (deactivatedAt === null || Date.now() - deactivatedAt > THIRTY_DAYS_MS) {
    return NextResponse.json({ error: 'The reactivation window has expired.' }, { status: 400 })
  }

  if (!(await passwordsMatch(body.password, user.password_hash))) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 400 })
  }

  const { error: reactivateError } = await handleUserStatusChange(user.user_id, 'active')
  if (reactivateError) {
    return NextResponse.json({ error: 'Could not reactivate account.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
