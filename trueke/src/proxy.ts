import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')
  const userId = request.cookies.get('user_id')

  if (!sessionToken?.value || !userId?.value) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/user/:path*', '/admin/:path*'],
}
