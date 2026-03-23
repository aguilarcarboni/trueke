import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/utils/auth"
import { createClient } from "@/utils/supabase/server"

const ITEM_IMAGES_BUCKET = process.env.SUPABASE_ITEM_IMAGES_BUCKET || process.env.SUPABASE_PROFILE_IMAGES_BUCKET || "images"
const MAX_ITEM_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_ITEM_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
])

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
      return NextResponse.json({ error: "User not authenticated." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file was provided." }, { status: 400 })
    }

    if (!ALLOWED_ITEM_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WEBP, and GIF images are allowed." },
        { status: 400 }
      )
    }

    if (file.size > MAX_ITEM_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image must be 10MB or smaller." }, { status: 400 })
    }

    const rawFileName = file.name || "item-image"
    const fileExt = rawFileName.includes(".")
      ? rawFileName.split(".").pop()?.toLowerCase() || "jpg"
      : "jpg"
    const safeFileExt = fileExt.replace(/[^a-z0-9]/g, "") || "jpg"
    const uniquePart = `${Date.now()}-${crypto.randomUUID()}`
    const path = `users/${userId}/items/${uniquePart}.${safeFileExt}`

    const supabase = await createClient()
    const { error: uploadError } = await supabase.storage
      .from(ITEM_IMAGES_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(ITEM_IMAGES_BUCKET).getPublicUrl(path)

    if (!publicUrl) {
      return NextResponse.json(
        { error: "Image was uploaded but no public URL was returned." },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: publicUrl, mediaType: `.${safeFileExt}` }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected upload error."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
