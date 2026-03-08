import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { ApiResponse } from '@/lib/types'

/**
 * GET /api/exchanges/[exchangeId]
 * Get specific exchange details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { exchangeId: string } }
) {
  try {
    const { exchangeId } = params

    if (!exchangeId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Exchange ID is required',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_exchange_details', {
      p_exchange_id: exchangeId,
    })

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    if (data && data.length > 0) {
      return NextResponse.json<ApiResponse<any>>({
        success: true,
        data: data[0],
      })
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Exchange not found',
      },
      { status: 404 }
    )
  } catch (err) {
    console.error('Error in GET /api/exchanges/[exchangeId]:', err)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/exchanges/[exchangeId]
 * Update exchange status (accept, reject, cancel)
 * Body:
 * {
 *   action: 'accept' | 'reject' | 'cancel',
 *   user_id: UUID
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { exchangeId: string } }
) {
  try {
    const { exchangeId } = params
    const body = await request.json()
    const { action, user_id } = body

    if (!exchangeId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Exchange ID is required',
        },
        { status: 400 }
      )
    }

    if (!action || !user_id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'action and user_id are required',
        },
        { status: 400 }
      )
    }

    if (!['accept', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Invalid action. Must be one of: accept, reject, cancel',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    let data, error

    switch (action) {
      case 'accept':
        ;({ data, error } = await supabase.rpc('accept_exchange', {
          p_exchange_id: exchangeId,
          p_accepting_user_id: user_id,
        }))
        break
      case 'reject':
        ;({ data, error } = await supabase.rpc('reject_exchange', {
          p_exchange_id: exchangeId,
          p_rejecting_user_id: user_id,
        }))
        break
      case 'cancel':
        ;({ data, error } = await supabase.rpc('cancel_exchange', {
          p_exchange_id: exchangeId,
          p_initiator_user_id: user_id,
        }))
        break
    }

    if (error) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    if (data && data.length > 0) {
      const result = data[0]
      if (result.success) {
        return NextResponse.json<ApiResponse<null>>({
          success: true,
          message: result.message,
        })
      } else {
        return NextResponse.json<ApiResponse<null>>(
          {
            success: false,
            error: result.message,
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: `Unknown error ${action}ing exchange`,
      },
      { status: 500 }
    )
  } catch (err) {
    console.error('Error in PATCH /api/exchanges/[exchangeId]:', err)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      },
      { status: 500 }
    )
  }
}
