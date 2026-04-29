// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loginUserWithCredentials } from './user'

vi.mock('bcrypt', () => ({
  default: { compare: vi.fn().mockResolvedValue(true) },
}))

const mockMaybeSingle = vi.fn()
const mockRpc = vi.fn()
vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }) }),
    rpc: mockRpc,
  }),
}))

describe('loginUserWithCredentials', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws AccountBanned when the user is permanently banned (no expiry)', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { user_id: '1', email: 'a@b.com', status: 'banned', end_ban_date_time: null, password_hash: 'hash' } })
    await expect(loginUserWithCredentials('a@b.com', 'pass')).rejects.toThrow('AccountBanned')
  })

  it('throws AccountBanned:ISO_DATE when the ban is still active with an expiry', async () => {
    const futureDate = new Date(Date.now() + 7 * 86400_000).toISOString()
    mockMaybeSingle.mockResolvedValueOnce({ data: { user_id: '1', email: 'a@b.com', status: 'banned', end_ban_date_time: futureDate, password_hash: 'hash' } })
    await expect(loginUserWithCredentials('a@b.com', 'pass')).rejects.toThrow(`AccountBanned:${futureDate}`)
  })

  it('auto-restores to active and returns user when ban has expired', async () => {
    const pastDate = new Date(Date.now() - 86400_000).toISOString()
    const userData = { user_id: '1', email: 'a@b.com', status: 'banned', end_ban_date_time: pastDate, password_hash: 'hash' }
    mockMaybeSingle.mockResolvedValueOnce({ data: userData })
    mockRpc.mockResolvedValueOnce({ error: null })
    const result = await loginUserWithCredentials('a@b.com', 'pass')
    expect(result).toMatchObject({ status: 'active', end_ban_date_time: null })
    expect(mockRpc).toHaveBeenCalledWith('handle_user_status_change', { p_user_id: '1', p_new_status: 'active' })
  })

  it('remains banned when ban has expired but RPC restore fails', async () => {
    const pastDate = new Date(Date.now() - 86400_000).toISOString()
    const userData = { user_id: '1', email: 'a@b.com', status: 'banned', end_ban_date_time: pastDate, password_hash: 'hash' }
    mockMaybeSingle.mockResolvedValueOnce({ data: userData })
    mockRpc.mockResolvedValueOnce({ error: new Error('RPC failed') })
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
