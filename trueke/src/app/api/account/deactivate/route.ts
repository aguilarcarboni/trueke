import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUserIdFromNextRequest } from '@/utils/auth-server'
import { createClient } from '@/utils/supabase/server'
import { passwordsMatch } from '@/lib/server/account/user-password'

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUserIdFromNextRequest(req)
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
  }

  let body: { password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (!body.password?.trim()) {
    return NextResponse.json({ error: 'Password is required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: user, error: fetchError } = await supabase
    .from('user')
    .select('password_hash')
    .eq('user_id', userId)
    .single()

  if (fetchError || !user) {
    return NextResponse.json({ error: 'Could not load your account.' }, { status: 500 })
  }

  if (!(await passwordsMatch(body.password, user.password_hash))) {
    return NextResponse.json({ error: 'Incorrect password.' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('user')
    .update({ status: 'inactive' })
    .eq('user_id', userId)

  if (updateError) {
    return NextResponse.json({ error: 'Could not deactivate account.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
