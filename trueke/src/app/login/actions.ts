'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import bcrypt from 'bcrypt'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate inputs
  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  try {
    // Create Supabase client
    const supabase = await createClient()

    // Query custom user table
    const { data: user, error: queryError } = await supabase
      .from('user')
      .select('*')
      .eq('email', email)
      .single()

    if (queryError || !user) {
      return { error: 'No account found with this email address.' }
    }

    // Check user status (e.g. only allow 'active' users to log in)
    if (user.status !== 'active') {
      return { error: 'This account is not active. Please contact support.' }
    }

    // Check if user is banned
    if (user.end_ban_date_time) {
      const banEndDate = new Date(user.end_ban_date_time)
      if (banEndDate > new Date()) {
        return { error: 'This account has been disabled. Please contact support.' }
      }
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return { error: 'Invalid email or password. Please try again.' }
    }

    // Create session token
    const sessionToken = generateSessionToken()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Store session in cookies
    const cookieStore = await cookies()
    cookieStore.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })
    
    cookieStore.set('user_id', user.user_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    })

    // Update last login time (optional)
    await supabase
      .from('user')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', user.user_id)

    // Audit log: record successful login
    const headersList = await headers()
    const ipRaw =
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      null
    // Use 0.0.0.0 when missing so insert never fails
    const ipAddress = ipRaw || '0.0.0.0'

    const { error: auditError } = await supabase.from('login_event').insert({
      login_event_id: crypto.randomUUID(),
      user_id: user.user_id,
      event_type: 'login',
      event_time: new Date().toISOString(),
      ip_address: ipAddress,
      user_agent: headersList.get('user-agent') || null,
    })

    if (auditError) console.error('Login event insert failed:', auditError)

    // Revalidate the path to update auth state
    revalidatePath('/', 'layout')
    
    return { 
      success: true, 
      user: {
        id: user.user_id,
        email: user.email,
        name: user.username || `${user.first_name} ${user.last_name}`.trim(),
        avatar: user.profile_picture_url,
        isAdmin: user.is_admin,
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function logout(): Promise<{ error?: string }> {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('user_id')?.value

    // Delete session cookies first
    cookieStore.delete('session_token')
    cookieStore.delete('user_id')

    // Audit log (only if we had a user to log out)
    if (userId) {
      const headersList = await headers()
      const ipRaw = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || null
      const ipAddress = ipRaw || '0.0.0.0'

      const supabase = await createClient()
      const { error: auditError } = await supabase.from('login_event').insert({
        login_event_id: crypto.randomUUID(),
        user_id: userId,
        event_type: 'logout',
        event_time: new Date().toISOString(),
        ip_address: ipAddress,
        user_agent: headersList.get('user-agent') || null,
      })
      if (auditError) console.error('Logout event insert failed:', auditError)
    }

    revalidatePath('/', 'layout')
    return {}
  } catch (error) {
    console.error('Logout error:', error)
    return { error: 'Failed to sign out. Please try again.' }
  }
}

// Helper function to generate session token
function generateSessionToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}
