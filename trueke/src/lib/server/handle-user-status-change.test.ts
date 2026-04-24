import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleUserStatusChange, handleBanUser } from './handle-user-status-change'

vi.mock('@/lib/server/mail/account-emails', () => ({ sendAccountDeactivationEmail: vi.fn() }))

const mockUpdate = vi.fn()
const mockRpc = vi.fn().mockResolvedValue({ error: null })
const mockSingle = vi.fn()
vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: mockSingle }) }),
      update: () => ({ eq: mockUpdate }),
    }),
    rpc: mockRpc,
  }),
}))

describe('handleUserStatusChange', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty object even when the user is not found (best-effort email)', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    const result = await handleUserStatusChange('user-1', 'inactive')
    expect(result).toEqual({})
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

describe('handleBanUser', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns an error when the DB update fails', async () => {
    mockUpdate.mockResolvedValueOnce({ error: { message: 'update failed' } })
    const result = await handleBanUser('user-1', new Date('2999-01-01'), 'spam')
    expect(result.error).toBe('update failed')
  })

  it('calls the RPC and returns empty object on success', async () => {
    mockUpdate.mockResolvedValueOnce({ error: null })
    const result = await handleBanUser('user-1', new Date('2999-01-01'), 'spam')
    expect(mockRpc).toHaveBeenCalledWith('handle_user_status_change', expect.objectContaining({ p_new_status: 'banned' }))
    expect(result).toEqual({})
  })
})
