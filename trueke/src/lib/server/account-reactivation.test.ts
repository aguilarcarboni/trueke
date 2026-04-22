import { describe, it, expect, vi, beforeEach } from 'vitest'
import { runReactivationRequest, runReactivationConfirm } from './account-reactivation'

vi.mock('@/lib/server/mail/account-emails', () => ({
  sendReactivationCodeEmail: vi.fn().mockResolvedValue({ ok: true }),
}))
vi.mock('@/lib/server/verification-code', () => ({
  generateSixDigitCode: vi.fn().mockReturnValue('123456'),
}))
vi.mock('@/lib/server/handle-user-status-change', () => ({
  handleUserStatusChange: vi.fn().mockResolvedValue({}),
}))

const mockMaybeSingle = vi.fn()
vi.mock('@/utils/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mockMaybeSingle }) }) }),
  }),
}))

describe('runReactivationRequest', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects when the 30-day window has expired', async () => {
    const expired = new Date(Date.now() - 31 * 86400_000).toISOString()
    mockMaybeSingle.mockResolvedValueOnce({ data: { user_id: '1', status: 'inactive', deactivated_at: expired } })
    const result = await runReactivationRequest('a@b.com')
    expect(result).toMatchObject({ ok: false, error: 'The reactivation window has expired.' })
  })

  it('returns a code when the account is within the window', async () => {
    const recent = new Date(Date.now() - 5 * 86400_000).toISOString()
    mockMaybeSingle.mockResolvedValueOnce({ data: { user_id: '1', status: 'inactive', deactivated_at: recent } })
    const result = await runReactivationRequest('a@b.com')
    expect(result).toMatchObject({ ok: true, code: '123456' })
  })
})

describe('runReactivationConfirm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects a wrong code', async () => {
    const result = await runReactivationConfirm('000000', '123456', 'a@b.com')
    expect(result.error).toBe('Invalid verification code.')
  })

  it('reactivates the account when code matches', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { user_id: '1' } })
    const result = await runReactivationConfirm('123456', '123456', 'a@b.com')
    expect(result.success).toBe('Your account has been successfully reactivated.')
  })
})
