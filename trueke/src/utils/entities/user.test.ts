import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginUserWithCredentials } from './user'

vi.mock('bcrypt', () => ({
  default: { compare: vi.fn().mockResolvedValue(true) },
}))

const mockMaybeSingle = vi.fn()
vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }) }),
  }),
}))

describe('loginUserWithCredentials', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws AccountBanned when the user is banned', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { user_id: '1', email: 'a@b.com', status: 'banned', password_hash: 'hash' } })
    await expect(loginUserWithCredentials('a@b.com', 'pass')).rejects.toThrow('AccountBanned')
  })

  it('throws AccountDeactivatedRecoverable within the 30-day window', async () => {
    const recent = new Date(Date.now() - 5 * 86400_000).toISOString()
    mockMaybeSingle.mockResolvedValueOnce({ data: { user_id: '1', email: 'a@b.com', status: 'inactive', password_hash: 'hash', deactivated_at: recent } })
    await expect(loginUserWithCredentials('a@b.com', 'pass')).rejects.toThrow('AccountDeactivatedRecoverable')
  })

  it('throws AccountDeactivated when the window has expired', async () => {
    const expired = new Date(Date.now() - 31 * 86400_000).toISOString()
    mockMaybeSingle.mockResolvedValueOnce({ data: { user_id: '1', email: 'a@b.com', status: 'inactive', password_hash: 'hash', deactivated_at: expired } })
    await expect(loginUserWithCredentials('a@b.com', 'pass')).rejects.toThrow('AccountDeactivated')
  })

  it('throws Invalid credentials when user is not found', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })
    await expect(loginUserWithCredentials('a@b.com', 'pass')).rejects.toThrow('Invalid credentials')
  })
})
