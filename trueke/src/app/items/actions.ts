"use server"

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Item } from '@/lib/data'

export async function updateItem(
  itemId: string,
  updates: Partial<Omit<Item, 'id' | 'owner' | 'createdAt' | 'images'>>
) {
  try {
    // Get session from cookies to verify user is authenticated
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')

    if (!userId) {
      return { error: 'Not authenticated' }
    }

    // Create Supabase client
    const supabase = await createClient()

    // First, verify that the user owns this item
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

    // Update only the provided fields, mapping Item interface to database schema
    const updateData: any = {}
    
    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.type !== undefined) updateData.item_type = updates.type
    if (updates.state !== undefined) updateData.status = updates.state
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.condition !== undefined) updateData.condition = updates.condition
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.metadata !== undefined) updateData.metadata = updates.metadata

    // Perform the update
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
