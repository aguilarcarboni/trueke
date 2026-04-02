"use server"

import { createClient } from '@/utils/supabase/server'
import { Item, ItemWithAddress } from '@/lib/entities/item';
import { Address } from '@/lib/entities/address';
import { getAuthenticatedUserId } from '@/utils/auth-server';

export interface ItemDetailsResponse {
  item: {
    item_id: string
    title: string
    description: string | null
    category: string
    condition: string
    status: string
    item_type: string
    date_bought: string | null
    last_date_uploaded: string
  }
  owner: {
    user_id: string
    username: string
    first_name: string
    last_name: string
    profile_picture_url: string | null
  }
  address: {
    address_id: string
    country_code: string
    address_line1: string
    address_line2: string
    muni_district: string
    canton_city: string
    province_state: string
    zip_code: string
  } | null
}

export async function getItemDetails(itemId: string): Promise<{ status: number; data?: ItemDetailsResponse; error?: string }> {
  try {
    const normalizedItemId = itemId.trim()
    if (!normalizedItemId) {
      return { status: 400, error: 'Item ID is required' }
    }

    const supabase = await createClient()

    const { data: item, error: itemError } = await supabase
      .from('item')
      .select('item_id,title,description,category,condition,status,item_type,date_bought,last_date_uploaded,owner_user_id')
      .eq('item_id', normalizedItemId)
      .single()

    if (itemError || !item) {
      return { status: 404, error: 'Item not found' }
    }

    const { data: owner, error: ownerError } = await supabase
      .from('user')
      .select('user_id,username,first_name,last_name,profile_picture_url')
      .eq('user_id', item.owner_user_id)
      .single()

    if (ownerError || !owner) {
      return { status: 404, error: 'Item owner not found' }
    }

    const { data: currentAddressLink } = await supabase
      .from('item_address')
      .select('address_id')
      .eq('item_id', normalizedItemId)
      .eq('is_current', true)
      .maybeSingle()

    let address: ItemDetailsResponse['address'] = null

    if (currentAddressLink?.address_id) {
      const { data: itemAddress } = await supabase
        .from('address')
        .select('address_id,country_code,address_line1,address_line2,muni_district,canton_city,province_state,zip_code')
        .eq('address_id', currentAddressLink.address_id)
        .maybeSingle()

      if (itemAddress) {
        address = itemAddress
      }
    }

    return {
      status: 200,
      data: {
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
        owner,
        address,
      },
    }
  } catch (error) {
    console.error('Get item details error:', error)
    return { status: 500, error: 'Unable to load item details right now.' }
  }
}

export async function getItemsWithAddressByOwner(userId: string): Promise<{ success: boolean; data?: ItemWithAddress[]; error?: string }> {
  try {
    const normalizedUserId = userId.trim()
    if (!normalizedUserId) {
      return { success: false, error: 'User ID is required' }
    }

    const supabase = await createClient()

    const { data: items, error: itemsError } = await supabase
      .from('item')
      .select('item_id,title,description,condition,category,item_type,status,owner_user_id,last_date_uploaded,date_bought')
      .eq('owner_user_id', normalizedUserId)
      .order('last_date_uploaded', { ascending: false })

    if (itemsError) {
      return { success: false, error: itemsError.message }
    }

    if (!items || items.length === 0) {
      return { success: true, data: [] }
    }

    const itemIds = items.map((i) => i.item_id)

    const [{ data: mediaRows, error: mediaError }, { data: links, error: linksError }] = await Promise.all([
      supabase
        .from('item_media')
        .select('item_id,url,display_order')
        .in('item_id', itemIds)
        .order('display_order', { ascending: true }),
      supabase
        .from('item_address')
        .select('item_id,address_id')
        .in('item_id', itemIds)
        .eq('is_current', true),
    ])

    if (mediaError) {
      return { success: false, error: mediaError.message }
    }

    if (linksError) {
      return { success: false, error: linksError.message }
    }

    const mediaByItem = new Map<string, string[]>()
    for (const row of mediaRows || []) {
      const existing = mediaByItem.get(row.item_id) || []
      existing.push(row.url)
      mediaByItem.set(row.item_id, existing)
    }

    const currentAddressByItem = new Map<string, string>()
    const addressIds = new Set<string>()
    for (const link of links || []) {
      currentAddressByItem.set(link.item_id, link.address_id)
      addressIds.add(link.address_id)
    }

    let addressesById = new Map<string, ItemWithAddress['address']>()
    if (addressIds.size > 0) {
      const { data: addressRows, error: addressesError } = await supabase
        .from('address')
        .select('address_id,country_code,address_line1,address_line2,muni_district,canton_city,province_state,zip_code')
        .in('address_id', Array.from(addressIds))

      if (addressesError) {
        return { success: false, error: addressesError.message }
      }

      addressesById = new Map(
        (addressRows || []).map((addr) => [
          addr.address_id,
          {
            addressId: addr.address_id,
            countryCode: addr.country_code,
            addressLine1: addr.address_line1 ?? '',
            addressLine2: addr.address_line2 ?? '',
            muniDistrict: addr.muni_district ?? '',
            city: addr.canton_city ?? '',
            province: addr.province_state ?? '',
            zipCode: addr.zip_code ?? '',
          },
        ])
      )
    }

    const data: ItemWithAddress[] = items.map((item) => {
      const linkedAddressId = currentAddressByItem.get(item.item_id)
      return {
        item_id: item.item_id,
        title: item.title,
        description: item.description ?? '',
        condition: item.condition,
        category: item.category,
        item_type: item.item_type,
        status: item.status,
        images: mediaByItem.get(item.item_id) || [],
        owner_user_id: item.owner_user_id,
        owner_name: '',
        last_date_uploaded: item.last_date_uploaded,
        date_bought: item.date_bought ?? undefined,
        address: linkedAddressId ? addressesById.get(linkedAddressId) ?? null : null,
      }
    })

    return { success: true, data }
  } catch (error) {
    console.error('Get items with address by owner error:', error)
    return { success: false, error: 'An error occurred while loading your items' }
  }
}

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
    const userId = await getAuthenticatedUserId()

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
          owner_user_id: userId,
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

export async function updateItemImages(
  itemId: string,
  imageUrls: string[]
): Promise<{ error: string | null }> {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) return { error: 'Not authenticated' }

    const supabase = await createClient()

    const { data: item, error: fetchError } = await supabase
      .from('item')
      .select('owner_user_id')
      .eq('item_id', itemId)
      .single()

    if (fetchError || !item) return { error: 'Item not found' }
    if (item.owner_user_id !== userId) return { error: 'Unauthorized: You do not own this item' }

    const { error: deleteError } = await supabase
      .from('item_media')
      .delete()
      .eq('item_id', itemId)

    if (deleteError) return { error: deleteError.message }

    if (imageUrls.length > 0) {
      const inserts = imageUrls.map((url, index) => {
        const ext = url.startsWith('data:')
          ? '.jpg'
          : '.' + (url.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg')
        return {
          item_id: itemId,
          url,
          media_type: ext,
          display_order: index + 1,
        }
      })

      const { error: insertError } = await supabase.from('item_media').insert(inserts)
      if (insertError) return { error: insertError.message }
    }

    return { error: null }
  } catch (err) {
    console.error('updateItemImages error:', err)
    return { error: 'An unexpected error occurred.' }
  }
}


export async function updateItem(
  itemId: string,
  updates: Partial<Omit<Item, 'id' | 'owner' | 'createdAt' | 'images'>>,
  address?: Omit<Address, 'addressId'>
) {
  try {
    const userId = await getAuthenticatedUserId()

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

    if (item.owner_user_id !== userId) {
      return { error: 'Unauthorized: You do not own this item' }
    }

    const updateData: any = {}
    
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.item_type !== undefined) updateData.item_type = updates.item_type
    if (updates.status !== undefined) updateData.status = updates.status
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

    if (address) {
      const addressResult = await updateItemAddress(itemId, address)
      if (addressResult.error) {
        return { error: addressResult.error }
      }
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
  address: Omit<Address, "addressId">
): Promise<{ error: string | null }> {
  try {
    const userId = await getAuthenticatedUserId()

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

    if (item.owner_user_id !== userId) {
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

export async function changeItemStatus(
  itemId: string,
  action: 'publish' | 'archive' | 'set-draft'
): Promise<{ error: string | null }> {
  try {
    const userId = await getAuthenticatedUserId()

    if (!userId) {
      return { error: 'Not authenticated' }
    }

    const supabase = await createClient()

    const { data: item, error: fetchError } = await supabase
      .from('item')
      .select('owner_user_id, status')
      .eq('item_id', itemId)
      .single()

    if (fetchError || !item) {
      return { error: 'Item not found' }
    }

    if (item.owner_user_id !== userId) {
      return { error: 'Unauthorized: You do not own this item' }
    }

    if (action === 'publish') {
      if (item.status !== 'draft' && item.status !== 'archived') {
        return { error: 'Only draft or archived items can be published' }
      }
    } else if (action === 'archive') {
      if (item.status !== 'draft' && item.status !== 'active') {
        return { error: 'Only draft or active items can be archived' }
      }
    } else if (action === 'set-draft') {
      if (item.status !== 'active' && item.status !== 'archived') {
        return { error: 'Only active or archived items can be set as draft' }
      }
    }

    const newStatus = action === 'publish' ? 'active' : action === 'archive' ? 'archived' : 'draft'

    const { error: updateError } = await supabase
      .from('item')
      .update({ status: newStatus })
      .eq('item_id', itemId)

    if (updateError) {
      return { error: updateError.message }
    }

    return { error: null }
  } catch (error) {
    console.error('Change item status error:', error)
    return { error: 'An error occurred while updating the item status' }
  }
}

export async function createItemReport(
  itemId: string,
  reason: string,
  description?: string
): Promise<{ status: number; error?: string }> {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return { status: 401, error: 'You must be logged in to report an item.' }
    }

    const normalizedItemId = itemId.trim()
    if (!normalizedItemId) {
      return { status: 400, error: 'Item ID is required.' }
    }
    if (!reason.trim()) {
      return { status: 400, error: 'A reason is required.' }
    }

    const supabase = await createClient()

    const { data: item, error: itemError } = await supabase
      .from('item')
      .select('owner_user_id')
      .eq('item_id', normalizedItemId)
      .single()

    if (itemError || !item) {
      return { status: 404, error: 'Item not found.' }
    }

    if (item.owner_user_id === userId) {
      return { status: 403, error: 'You cannot report your own item.' }
    }

    const { data: existing } = await supabase
      .from('report')
      .select('report_id')
      .eq('reporter_user_id', userId)
      .eq('target_id', normalizedItemId)
      .eq('target_type', 'item')
      .maybeSingle()

    if (existing) {
      return { status: 409, error: 'You have already reported this item.' }
    }

    const { error: insertError, data: reportData } = await supabase
      .from('report')
      .insert({
        reporter_user_id: userId,
        target_type: 'item',
        target_id: normalizedItemId,
        reason: reason.trim(),
        description: description?.trim() || null,
      })
      .select('report_id')
      .single()

    if (insertError) {
      console.error('Create item report error:', insertError)
      return { status: 500, error: 'Failed to submit report. Please try again.' }
    }

    // Fetch item title for notification bodies
    const { data: itemDetails } = await supabase
      .from('item')
      .select('title')
      .eq('item_id', normalizedItemId)
      .maybeSingle()

    const itemTitle = itemDetails?.title ?? 'an item'
    const reportId: string | undefined = reportData?.report_id

    // Non-blocking: send confirmation to the reporter
    supabase.from('notification').insert({
      recipient_user_id: userId,
      sender_user_id: null,
      type: 'item_reported',
      reference_type: 'report',
      reference_id: reportId ?? null,
      title: 'Report Submitted',
      body: `Your report for "${itemTitle}" has been received and is under review.`,
      is_read: false,
      delivery_channel: 'in_app',
      status: 'queued',
      priority: 'normal',
    }).then(({ error }) => {
      if (error) console.error('Failed to send reporter notification:', error)
    })

    // Non-blocking: notify the item owner
    supabase.from('notification').insert({
      recipient_user_id: item.owner_user_id,
      sender_user_id: null,
      type: 'item_reported',
      reference_type: 'report',
      reference_id: reportId ?? null,
      title: 'Your Item Has Been Reported',
      body: `"${itemTitle}" has received a report. Our team will review it shortly.`,
      is_read: false,
      delivery_channel: 'in_app',
      status: 'queued',
      priority: 'normal',
    }).then(({ error }) => {
      if (error) console.error('Failed to send owner notification:', error)
    })

    return { status: 201 }
  } catch (error) {
    console.error('Create item report error:', error)
    return { status: 500, error: 'An unexpected error occurred.' }
  }
}

export async function hasUserReportedItem(
  itemId: string
): Promise<boolean> {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId || !itemId.trim()) return false

    const supabase = await createClient()

    const { data } = await supabase
      .from('report')
      .select('report_id')
      .eq('reporter_user_id', userId)
      .eq('target_id', itemId.trim())
      .eq('target_type', 'item')
      .maybeSingle()

    return !!data
  } catch {
    return false
  }
}
