import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Item, ItemImage, User } from '@/lib/data'


function mapDatabaseItemToItem(dbItem: any, owner?: User): Item {
  return {
    id: dbItem.item_id,
    title: dbItem.title,
    description: dbItem.description || "",
    condition: dbItem.condition,
    category: dbItem.category,
    type: dbItem.item_type,
    state: dbItem.status,
    images: dbItem.item_media?.map((media: any) => media.url) || [],
    owner: owner || {
      id: dbItem.owner_user_id,
      name: "Unknown User",
      avatar: "",
      location: "",
      rating: 0,
      bio: "",
      joinedDate: "",
      totalTrades: 0,
    },
    createdAt: dbItem.last_date_uploaded || new Date().toISOString(),
  }
}


function mapDatabaseMediaToItemImage(dbMedia: any, item?: Item): ItemImage {
  return {
    url: dbMedia.url,
    media_type: dbMedia.media_type,
    display_order: dbMedia.display_order,
    item: item || ({} as Item),
  }
}

/**
 * Fetch images for multiple items by their IDs
 * Used internally by getCurrentUserItems to avoid N+1 queries
 */
async function getCurrentItemImages(itemIds: string[]) {
  try {
    // Create Supabase client
    const supabase = await createClient()

    // Fetch all images for the given item IDs
    const { data: allImages, error } = await supabase
      .from('item_media')
      .select('item_id, url, media_type, display_order')
      .in('item_id', itemIds)
      .order('item_id', { ascending: true })
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching item images:', error)
      return null
    }

    return allImages
  } catch (error) {
    console.error('Get current item images error:', error)
    return null
  }
}

export async function getCurrentUserItems(): Promise<Item[] | null> {
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

    // Fetch all images for these items using the helper function
    const allImages = await getCurrentItemImages(itemIds)

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

    // Map database items to Item interface
    const mappedItems: Item[] = itemsWithImages.map((dbItem: any) =>
      mapDatabaseItemToItem(dbItem)
    )

    return mappedItems
  } catch (error) {
    console.error('Get current user items error:', error)
    return null
  }
}
