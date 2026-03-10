import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { ApiResponse } from '@/lib/types'

/**
 * GET /api/exchanges
 * Get user's exchanges with optional status filter
 * Query params:
 *  - user_id: UUID of the user (required)
 *  - status: Filter by status (pending|accepted|rejected|expired|cancelled) (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    const status = searchParams.get('status')

    if (!userId) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'user_id is required',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc('get_user_exchanges', {
      p_user_id: userId,
      p_status: status || null,
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

    return NextResponse.json<ApiResponse<any>>({
      success: true,
      data: data || [],
    })
  } catch (err) {
    console.error('Error in GET /api/exchanges:', err)
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
 * POST /api/exchanges
 * Create a new exchange proposal
 * Body:
 * {
 *   initiator_id: UUID,
 *   target_user_id: UUID,
 *   offered_item_ids: UUID[],
 *   requested_item_ids: UUID[],
 *   message?: string,
 *   expiration_days?: number (default: 7, can be any positive number for days/weeks/months)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      initiator_id,
      target_user_id,
      offered_item_ids,
      requested_item_ids,
      message,
      expiration_days,
    } = body

    // Validate required fields
    if (!initiator_id || !target_user_id || !offered_item_ids || !requested_item_ids) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(offered_item_ids) || offered_item_ids.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'At least one offered item is required',
        },
        { status: 400 }
      )
    }

    if (!Array.isArray(requested_item_ids) || requested_item_ids.length === 0) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'At least one requested item is required',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc('create_exchange_proposal', {
      p_initiator_id: initiator_id,
      p_target_user_id: target_user_id,
      p_offered_item_ids: offered_item_ids,
      p_requested_item_ids: requested_item_ids,
      p_message: message || null,
      p_expiration_days: expiration_days || 7,
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
      const result = data[0]
      if (result.status === 'success') {
        return NextResponse.json<ApiResponse<any>>(
          {
            success: true,
            data: { exchange_id: result.exchange_id },
            message: result.message,
          },
          { status: 201 }
        )
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
        error: 'Unknown error creating exchange',
      },
      { status: 500 }
    )
  } catch (err) {
    console.error('Error in POST /api/exchanges:', err)
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: err instanceof Error ? err.message : 'An error occurred',
      },
      { status: 500 }
    )
  }
}
