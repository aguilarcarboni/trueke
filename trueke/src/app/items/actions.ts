"use server"

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Item } from '@/lib/data'


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

    const errors: Record<string, string> = {}
    
    if (!payload.title?.trim()) {
      errors.title = 'Title is required'
    }
    
    if (!payload.description?.trim()) {
      errors.description = 'Description is required'
    }
    
    if (!payload.imageUrls || payload.imageUrls.length === 0) {
      errors.images = 'At least one image is required'
    }

    if (!payload.category?.trim()) {
      errors.category = 'Category is required'
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

    console.log('Item updated successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Update item error:', error)
    return { error: 'An error occurred while updating the item' }
  }
}
