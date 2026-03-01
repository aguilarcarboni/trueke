'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const firstName = formData.get('firstName') as string
  const lastName = formData.get('lastName') as string

  // Validate inputs
  if (!email || !password || !username) {
    return { error: 'Email, username, and password are required' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long' }
  }

  try {
    const supabase = await createClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('user')
      .select('user_id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return { error: 'An account with this email already exists' }
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('user')
      .select('user_id')
      .eq('username', username)
      .single()

    if (existingUsername) {
      return { error: 'This username is already taken' }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from('user')
      .insert({
        email,
        username,
        first_name: firstName || null,
        last_name: lastName || null,
        password_hash: passwordHash,
        status: 'active',
        is_admin: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) {
      console.error('Registration error:', insertError)
      return { error: 'Failed to create account. Please try again.' }
    }

    revalidatePath('/', 'layout')

    return { 
      success: true,
      message: 'Account created successfully! Please log in.',
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
