'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcrypt'

const SALT_ROUNDS = 10
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[?!*&]).{8,}$/
const LETTERS_ONLY = /^[a-zA-Z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff\s'\-]+$/
const ALPHANUMERIC_ONLY = /^[a-zA-Z0-9]+$/
const LOCATION_TEXT = /^[a-zA-Z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff\s'\-,\.]+$/
const ZIPCODE_PATTERN = /^[a-zA-Z0-9\s\-]+$/
const URL_PATTERN = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

export async function register(formData: FormData) {
  const email = (formData.get('email') as string)?.trim()
  const password = (formData.get('password') as string) ?? ''
  const username = (formData.get('username') as string)?.trim()
  const firstName = (formData.get('firstName') as string)?.trim()
  const lastName = (formData.get('lastName') as string)?.trim()
  const profilePictureUrl = (formData.get('profilePictureUrl') as string)?.trim()
  const bio = (formData.get('bio') as string)?.trim()
  const countryCode = (formData.get('countryCode') as string)?.trim()
  const province = (formData.get('province') as string)?.trim()
  const muniDistrict = (formData.get('muniDistrict') as string)?.trim()
  const cantonCity = (formData.get('cantonCity') as string)?.trim()
  const zipCode = (formData.get('zipCode') as string)?.trim()

  if (!email || !password || !username || !firstName || !lastName) {
    return { error: 'Email, username, first name, last name, and password are required.' }
  }

  if (!countryCode || !province || !muniDistrict || !cantonCity || !zipCode) {
    return { error: 'Country, province, municipality, canton, and zip code are required.' }
  }

  if (!EMAIL_PATTERN.test(email)) {
    return { error: 'Please provide a valid email address.' }
  }

  if (!LETTERS_ONLY.test(firstName) || !LETTERS_ONLY.test(lastName)) {
    return { error: 'First and last name may only contain letters, spaces, apostrophes, or hyphens.' }
  }

  if (!ALPHANUMERIC_ONLY.test(username)) {
    return { error: 'Username may only contain letters and numbers.' }
  }

  if (!PASSWORD_PATTERN.test(password)) {
    return { error: 'Password must be 8+ characters, include 1 uppercase letter, 1 number, and 1 special character (?, !, *, &).' }
  }

  if (profilePictureUrl && !URL_PATTERN.test(profilePictureUrl)) {
    return { error: 'Profile picture URL must be a valid http(s) URL.' }
  }

  if (!LOCATION_TEXT.test(province)) {
    return { error: 'Province contains invalid characters.' }
  }

  if (!LOCATION_TEXT.test(muniDistrict)) {
    return { error: 'Municipality contains invalid characters.' }
  }

  if (!LOCATION_TEXT.test(cantonCity)) {
    return { error: 'Canton contains invalid characters.' }
  }

  if (!ZIPCODE_PATTERN.test(zipCode)) {
    return { error: 'Zip code may only contain letters, numbers, spaces, and hyphens.' }
  }

  try {
    const supabase = await createClient()

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('user')
      .select('user_id')
      .eq('email', email)
      .maybeSingle()

    if (existingUser) {
      return { error: 'An account with this email already exists' }
    }

    // Check if username already exists
    const { data: existingUsername } = await supabase
      .from('user')
      .select('user_id')
      .eq('username', username)
      .maybeSingle()

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
        first_name: firstName,
        last_name: lastName,
        password_hash: passwordHash,
        profile_picture_url: profilePictureUrl || '',
        bio: bio || '',
        status: 'active',
        is_admin: false,
        created_at: new Date().toISOString(),
      })
      .select('user_id')
      .single()

    if (insertError) {
      console.error('Registration error:', insertError)
      return { error: 'Failed to create account. Please try again.' }
    }

    const { data: existingAddress } = await supabase
      .from('address')
      .select('address_id')
      .eq('country_code', countryCode)
      .eq('muni_district', muniDistrict)
      .eq('canton_city', cantonCity)
      .eq('province_state', province)
      .eq('zip_code', zipCode)
      .maybeSingle()

    let addressId = existingAddress?.address_id as string | undefined

    if (!addressId) {
      const { data: newAddress, error: addressError } = await supabase
        .from('address')
        .insert({
          country_code: countryCode,
          muni_district: muniDistrict,
          canton_city: cantonCity,
          province_state: province,
          zip_code: zipCode,
          address_line1: '',
          address_line2: '',
        })
        .select('address_id')
        .single()

      if (addressError || !newAddress?.address_id) {
        await supabase.from('user').delete().eq('user_id', newUser.user_id)
        console.error('Registration address error:', addressError)
        return { error: 'Account created could not be completed with location. Please try again.' }
      }

      addressId = newAddress.address_id
    }

    const { error: userAddressError } = await supabase
      .from('user_address')
      .insert({
        user_id: newUser.user_id,
        address_id: addressId,
        is_current: true,
      })

    if (userAddressError) {
      await supabase.from('user').delete().eq('user_id', newUser.user_id)
      console.error('Registration user_address error:', userAddressError)
      return { error: 'Account created could not be completed with location. Please try again.' }
    }

    revalidatePath('/', 'layout')

    return { 
      success: true,
      message: 'User created successfully! Please log in.',
    }
  } catch (error) {
    console.error('Registration error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}
