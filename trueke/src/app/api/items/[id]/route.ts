import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

// TEMP: replace this with the authenticated user id once auth is integrated
const TEMP_CURRENT_USER_ID = "f1d36273-3359-4eab-9968-bb180ce23246"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // 1) Fetch the item
    const { data: item, error: itemError } = await (supabase as any)
      .from("item")
      .select(`
        item_id,
        owner_user_id,
        title,
        description,
        last_date_uploaded,
        date_bought,
        condition,
        status,
        item_type,
        category
      `)
      .eq("item_id", id)
      .single()

    // 404 if item doesn't exist
    if (itemError || !item) {
      console.error("Item fetch error:", itemError)
      return NextResponse.json(
        { error: "Item not found" },
        { status: 404 }
      )
    }

    // 2) Enforce visibility rules
    // Draft items are viewable only by owner for now
    const isOwner = item.owner_user_id === TEMP_CURRENT_USER_ID

    if (item.status === "draft" && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // 3) Fetch small owner summary (non-sensitive only)
    const { data: owner, error: ownerError } = await (supabase as any)
      .from("user")
      .select(`
        user_id,
        username,
        first_name,
        last_name,
        profile_picture_url
      `)
      .eq("user_id", item.owner_user_id)
      .single()

    if (ownerError) {
      console.error("Owner fetch error:", ownerError)
      return NextResponse.json(
        { error: "Failed to fetch owner summary" },
        { status: 500 }
      )
    }

    // 4) Fetch current item address (if available)
    let address = null
    const { data: itemAddressLink, error: itemAddressError } = await (supabase as any)
      .from("item_address")
      .select("address_id")
      .eq("item_id", item.item_id)
      .eq("is_current", true)
      .maybeSingle()

    if (itemAddressError) {
      console.error("Item address link fetch error:", itemAddressError)
      return NextResponse.json(
        { error: "Failed to fetch item address" },
        { status: 500 }
      )
    }

    if (itemAddressLink?.address_id) {
      const { data: addressRow, error: addressError } = await (supabase as any)
        .from("address")
        .select(`
          address_id,
          country_code,
          address_line1,
          address_line2,
          muni_district,
          canton_city,
          province_state,
          zip_code
        `)
        .eq("address_id", itemAddressLink.address_id)
        .single()

      if (addressError) {
        console.error("Address fetch error:", addressError)
        return NextResponse.json(
          { error: "Failed to fetch address details" },
          { status: 500 }
        )
      }

      address = addressRow
    }

    // 5) Return payload
    return NextResponse.json({
      item: {
        item_id: item.item_id,
        title: item.title,
        description: item.description,
        category: item.category,
        condition: item.condition,
        status: item.status,
        item_type: item.item_type,
        date_bought: item.date_bought,
        last_date_uploaded: item.last_date_uploaded,
      },
      media: [], // no item_media table yet
      owner: {
        user_id: owner.user_id,
        username: owner.username,
        first_name: owner.first_name,
        last_name: owner.last_name,
        profile_picture_url: owner.profile_picture_url,
      },
      address,
    })
  } catch (error) {
    console.error("Unexpected item detail API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
