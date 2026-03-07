import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Item, ItemImage, ItemAddress, User } from '@/lib/data'


function mapDatabaseItemToItem(dbItem: any, owner?: User, address?: ItemAddress | null): Item {
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
    address: address ?? null,
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

/**
 * Fetch current addresses for multiple items by their IDs
 * Used internally by getCurrentUserItems to avoid N+1 queries
 */
async function getCurrentItemAddresses(itemIds: string[]) {
  try {
    const supabase = await createClient()

    // Fetch current item_address links
    const { data: itemAddressLinks, error: linkError } = await supabase
      .from('item_address')
      .select('item_id, address_id')
      .in('item_id', itemIds)
      .eq('is_current', true)

    if (linkError || !itemAddressLinks || itemAddressLinks.length === 0) {
      return {}
    }

    // Get unique address IDs
    const addressIds = [...new Set(itemAddressLinks.map((link: any) => link.address_id))]

    // Fetch all addresses
    const { data: addresses, error: addrError } = await supabase
      .from('address')
      .select('address_id, country_code, address_line1, address_line2, muni_district, canton_city, province_state, zip_code')
      .in('address_id', addressIds)

    if (addrError || !addresses) {
      return {}
    }

    // Create address lookup map
    const addressMap: Record<string, any> = {}
    addresses.forEach((addr: any) => {
      addressMap[addr.address_id] = addr
    })

    // Map item_id to address
    const itemAddressMap: Record<string, ItemAddress> = {}
    itemAddressLinks.forEach((link: any) => {
      const addr = addressMap[link.address_id]
      if (addr) {
        itemAddressMap[link.item_id] = {
          addressId: addr.address_id,
          countryCode: addr.country_code ?? "",
          addressLine1: addr.address_line1 ?? "",
          addressLine2: addr.address_line2 ?? "",
          muniDistrict: addr.muni_district ?? "",
          city: addr.canton_city ?? "",
          province: addr.province_state ?? "",
          zipCode: addr.zip_code ?? "",
        }
      }
    })

    return itemAddressMap
  } catch (error) {
    console.error('Get current item addresses error:', error)
    return {}
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

    // Fetch all addresses for these items
    const addressesByItemId = await getCurrentItemAddresses(itemIds)

    console.log('Fetched images:', allImages?.length ?? 0)
    console.log('Fetched addresses:', Object.keys(addressesByItemId).length)

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
      mapDatabaseItemToItem(dbItem, undefined, addressesByItemId[dbItem.item_id] ?? null)
    )

    return mappedItems
  } catch (error) {
    console.error('Get current user items error:', error)
    return null
  }
}
