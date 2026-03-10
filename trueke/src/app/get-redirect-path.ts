'use server'

import { getCurrentUser } from '@/utils/supabase/auth'

/**
 * Returns the path the user should be redirected to based on auth and role.
 * Used by the root page to show a loading screen while resolving redirect.
 */
export async function getRedirectPath(): Promise<'/login' | '/admin' | '/user'> {
  const user = await getCurrentUser()

  if (!user) {
    return '/login'
  }

  if (user.isAdmin) {
    return '/admin'
  }

  return '/user'
}
