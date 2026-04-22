import { describe, it, expect, vi } from 'vitest'
import { handleUserStatusChange } from './handle-user-status-change'

vi.mock('@/lib/server/mail/account-emails', () => ({ sendAccountDeactivationEmail: vi.fn() }))

const mockSingle = vi.fn()
vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ single: mockSingle }) }) }),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  }),
}))

describe('handleUserStatusChange', () => {
  it('returns "Could not load user account." when user is not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const result = await handleUserStatusChange('user-1', 'inactive')
    expect(result.error).toBe('Could not load user account.')
  })

  it('returns empty object on success', async () => {
    mockSingle.mockResolvedValueOnce({ data: { email: 'a@b.com', username: 'user' }, error: null })
    const result = await handleUserStatusChange('user-1', 'inactive')
    expect(result).toEqual({})
  })

  it('returns empty object when reactivating', async () => {
    const result = await handleUserStatusChange('user-1', 'active')
    expect(result).toEqual({})
  })
})
