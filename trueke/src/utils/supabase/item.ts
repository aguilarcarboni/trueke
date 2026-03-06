import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export async function getCurrentUserItems() {
  try {
    // Get session from cookies
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')

    // Check if user ID exists
    if (!userId) {
      console.warn('No user ID found in cookies')
      return null
    }

    // Create Supabase client
    const supabase = await createClient()

    // First, fetch items owned by user, excluding deleted items
    const { data: items, error: itemsError } = await supabase
      .from('item')
      .select('*')
      .eq('owner_user_id', userId.value)
      .neq('status', 'deleted')
      .order('last_date_uploaded', { ascending: false })

    if (itemsError) {
      console.error('Error fetching user items:', itemsError)
      return null
    }

    console.log('Fetched items:', items?.length ?? 0)

    // If no items, return empty array
    if (!items || items.length === 0) {
      console.log('No items found for user')
      return []
    }

    // Extract all item IDs
    const itemIds = items.map((item: any) => item.item_id)
    console.log('Item IDs:', itemIds)

    // Fetch all images for these items
    const { data: allImages, error: imagesError } = await supabase
      .from('item_media')
      .select('item_id, url, media_type, display_order')
      .in('item_id', itemIds)
      .order('item_id', { ascending: true })
      .order('display_order', { ascending: true })

    if (imagesError) {
      console.error('Error fetching item images:', imagesError)
      // Return items without images if image fetch fails
      return items.map((item: any) => ({ ...item, item_media: [] }))
    }

    console.log('Fetched images:', allImages?.length ?? 0)

    // Map images to items by item_id
    const imagesByItemId: Record<string, any[]> = {}
    
    if (allImages && allImages.length > 0) {
      allImages.forEach((image: any) => {
        if (!imagesByItemId[image.item_id]) {
          imagesByItemId[image.item_id] = []
        }
        imagesByItemId[image.item_id].push({
          url: image.url,
          media_type: image.media_type,
          display_order: image.display_order
        })
      })
    }

    console.log('Images by Item ID:', imagesByItemId)

    // Attach images to each item
    const itemsWithImages = items.map((item: any) => ({
      ...item,
      item_media: imagesByItemId[item.item_id] || [],
    }))

    console.log('Items with images attached:', itemsWithImages.length)

    return itemsWithImages
  } catch (error) {
    console.error('Get current user items error:', error)
    return null
  }
}

export async function getCurrentItemImage(itemId: string) {
  try {

    // Create Supabase client
    const supabase = await createClient()

    // Query items owned by user, excluding deleted items
    const { data: items, error } = await supabase
      .from('item_media')
      .select('*')
      .eq('item_id', itemId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching item images:', error)
      return null
    }

    return items
  } catch (error) {
    console.error('Get current item images error:', error)
    return null
  }
}