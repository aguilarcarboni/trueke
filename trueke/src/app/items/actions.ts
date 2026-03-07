"use server"

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Item, ItemAddress } from '@/lib/data'


export async function createItem(
  payload: {
    title: string
    description: string
    category: string
    type: 'physical' | 'digital'
    condition: 'new' | 'like new' | 'used' | 'heavily used' | 'broken'
    imageUrls?: string[]
  }
) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')

    if (!userId) {
      return { status: 403, error: 'Unauthorized: Not authenticated' }
    }

    // Only validate business rules not enforced by DB
    const errors: Record<string, string> = {}
    
    if (!payload.imageUrls || payload.imageUrls.length === 0) {
      errors.images = 'At least one image is required'
    }

    if (Object.keys(errors).length > 0) {
      return { status: 400, error: 'Validation failed', details: errors }
    }

    const supabase = await createClient()

    const { data: createdItem, error: createError } = await supabase
      .from('item')
      .insert([
        {
          owner_user_id: userId.value,
          title: payload.title.trim(),
          description: payload.description.trim(),
          category: payload.category.trim(),
          item_type: payload.type,
          condition: payload.condition,
          status: 'draft', 
          last_date_uploaded: new Date().toISOString(), 
        }
      ])
      .select()
      .single()

    if (createError || !createdItem) {
      console.error('Error creating item:', createError)
      return { status: 500, error: 'Failed to create item' }
    }

    if (payload.imageUrls && payload.imageUrls.length > 0) {
      const mediaInserts = payload.imageUrls.map((url, index) => ({
        item_id: createdItem.item_id,
        url: url,
        media_type: '.jpg', 
        display_order: index + 1
      }))

      const { error: mediaError } = await supabase
        .from('item_media')
        .insert(mediaInserts)

      if (mediaError) {
        console.error('Error inserting item media:', mediaError)
        return { status: 201, data: { id: createdItem.item_id, itemId: createdItem.item_id } }
      }
    }

    return { status: 201, data: { id: createdItem.item_id, itemId: createdItem.item_id } }
  } catch (error) {
    console.error('Create item error:', error)
    return { status: 500, error: 'An error occurred while creating the item' }
  }
}

export async function updateItem(
  itemId: string,
  updates: Partial<Omit<Item, 'id' | 'owner' | 'createdAt' | 'images'>>
) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')

    if (!userId) {
      return { error: 'Not authenticated' }
    }
    const supabase = await createClient()

    const { data: item, error: fetchError } = await supabase
      .from('item')
      .select('owner_user_id')
      .eq('item_id', itemId)
      .single()

    if (fetchError || !item) {
      return { error: 'Item not found' }
    }

    if (item.owner_user_id !== userId.value) {
      return { error: 'Unauthorized: You do not own this item' }
    }

    const updateData: any = {}
    
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.type !== undefined) updateData.item_type = updates.type
    if (updates.state !== undefined) updateData.status = updates.state
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.condition !== undefined) updateData.condition = updates.condition
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata

    const { data, error } = await supabase
      .from('item')
      .update(updateData)
      .eq('item_id', itemId)
      .select()

    if (error) {
      console.error('Error updating item:', error)
      return { error: 'Failed to update item' }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Update item error:', error)
    return { error: 'An error occurred while updating the item' }
  }
}

/**
 * Updates an item's address using the history-preserving pattern.
 * Creates a new address record (or reuses an existing one) and links it to the item.
 * The database trigger automatically deactivates the previous address link.
 */
export async function updateItemAddress(
  itemId: string,
  address: Omit<ItemAddress, "addressId">
): Promise<{ error: string | null }> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')

    if (!userId) {
      return { error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Verify item ownership
    const { data: item, error: fetchError } = await supabase
      .from('item')
      .select('owner_user_id')
      .eq('item_id', itemId)
      .single()

    if (fetchError || !item) {
      return { error: 'Item not found' }
    }

    if (item.owner_user_id !== userId.value) {
      return { error: 'Unauthorized: You do not own this item' }
    }

    // Check if any address fields are provided
    const hasAddressData = Object.values(address).some((v) => v?.trim())
    if (!hasAddressData) {
      return { error: null } // No address data to update
    }

    // Fetch the item's current linked address to detect changes
    const { data: existingLink } = await supabase
      .from('item_address')
      .select('address_id')
      .eq('item_id', itemId)
      .eq('is_current', true)
      .maybeSingle()

    let currentAddress: Record<string, string> | null = null

    // If item already has an address, fetch its details for comparison
    if (existingLink?.address_id) {
      const { data: curAddr } = await supabase
        .from('address')
        .select('country_code, address_line1, address_line2, muni_district, canton_city, province_state, zip_code')
        .eq('address_id', existingLink.address_id)
        .maybeSingle()
      currentAddress = curAddr as Record<string, string> | null
    }

    // Check if address data is unchanged
    const isUnchanged =
      currentAddress &&
      currentAddress.country_code   === (address.countryCode.trim() || "XX") &&
      currentAddress.address_line1  === address.addressLine1.trim() &&
      currentAddress.address_line2  === address.addressLine2.trim() &&
      currentAddress.muni_district  === address.muniDistrict.trim() &&
      currentAddress.canton_city    === address.city.trim() &&
      currentAddress.province_state === address.province.trim() &&
      currentAddress.zip_code       === address.zipCode.trim()

    if (isUnchanged) {
      return { error: null } // No changes needed
    }

    // Address changed — look up if an identical record already exists
    const { data: matchingAddr } = await supabase
      .from('address')
      .select('address_id')
      .eq('country_code',   address.countryCode.trim() || "XX")
      .eq('address_line1',  address.addressLine1.trim())
      .eq('address_line2',  address.addressLine2.trim())
      .eq('muni_district',  address.muniDistrict.trim())
      .eq('canton_city',    address.city.trim())
      .eq('province_state', address.province.trim())
      .eq('zip_code',       address.zipCode.trim())
      .maybeSingle()

    let targetAddressId: string

    if (matchingAddr?.address_id) {
      // Reuse the existing address record
      targetAddressId = matchingAddr.address_id
    } else {
      // Create a new address record
      const { data: newAddr, error: addrErr } = await supabase
        .from('address')
        .insert({
          country_code:   address.countryCode.trim() || "XX",
          address_line1:  address.addressLine1.trim(),
          address_line2:  address.addressLine2.trim(),
          muni_district:  address.muniDistrict.trim(),
          canton_city:    address.city.trim(),
          province_state: address.province.trim(),
          zip_code:       address.zipCode.trim(),
        })
        .select('address_id')
        .single()

      if (addrErr || !newAddr?.address_id) {
        return { error: addrErr?.message ?? 'Failed to create address.' }
      }
      targetAddressId = newAddr.address_id
    }

    // Associate item with the target address; upsert handles the case where
    // the item was already linked to this address_id (e.g. re-using an old one)
    const { error: linkErr } = await supabase
      .from('item_address')
      .upsert(
        { item_id: itemId, address_id: targetAddressId, is_current: true },
        { onConflict: 'item_id,address_id' }
      )

    if (linkErr) {
      return { error: linkErr.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Update item address error:', error)
    return { error: 'An error occurred while updating the item address' }
  }
}