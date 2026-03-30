import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import path from 'path'
import { randomUUID } from 'crypto'

const BUCKET = 'item-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let file: File | null = null
  try {
    const formData = await request.formData()
    const entry = formData.get('file')
    if (entry instanceof File) {
      file = entry
    }
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
  }

  if (!file) {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'File type not allowed. Accepted formats: JPEG, PNG, WEBP, GIF.' },
      { status: 400 },
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'File is too large. Maximum allowed size is 5 MB.' },
      { status: 400 },
    )
  }

  const ext = path.extname(file.name).toLowerCase() || '.jpg'
  const storagePath = `${session.user.id}/${randomUUID()}${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())

  const supabase = await createClient()

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    return NextResponse.json({ error: 'Failed to upload image.' }, { status: 500 })
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)

  return NextResponse.json({ url: publicUrlData.publicUrl, mediaType: ext })
}
