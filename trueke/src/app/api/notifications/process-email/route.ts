import { NextRequest, NextResponse } from 'next/server'
import { processQueuedEmailNotifications } from '@/utils/entities/notification-email-worker'

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return 50
  return Math.min(parsed, 200)
}

function makeRequestId(prefix: string): string {
  return `${prefix}-${Date.now()}`
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.NOTIFICATION_WORKER_SECRET
  const providedSecret = request.headers.get('x-notification-worker-secret')

  if (!configuredSecret || providedSecret !== configuredSecret) {
    return unauthorized()
  }

  const limit = parseLimit(request.nextUrl.searchParams.get('limit'))

  try {
    const result = await processQueuedEmailNotifications({
      limit,
      requestId: makeRequestId('cron'),
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('process-email: unexpected error:', error)
    return NextResponse.json(
      { error: 'Unexpected worker failure.' },
      { status: 500 }
    )
  }
}

/**
 * Browser-friendly endpoint for local testing.
 * Example: /api/notifications/process-email?secret=...&limit=25
 */
export async function GET(request: NextRequest) {
  const configuredSecret = process.env.NOTIFICATION_WORKER_SECRET
  const providedSecret = request.nextUrl.searchParams.get('secret')

  if (!configuredSecret || providedSecret !== configuredSecret) {
    return unauthorized()
  }

  const limit = parseLimit(request.nextUrl.searchParams.get('limit'))
  const recipientUserId = request.nextUrl.searchParams.get('recipientUserId') ?? undefined

  try {
    const result = await processQueuedEmailNotifications({
      limit,
      recipientUserId,
      requestId: makeRequestId('manual'),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('process-email (manual): unexpected error:', error)
    return NextResponse.json(
      { error: 'Unexpected worker failure.' },
      { status: 500 }
    )
  }
}
