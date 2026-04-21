import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSendEmail = vi.fn()
vi.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

import {
  sendPasswordChangeNotificationEmail,
  sendEmailChangeNotificationToOldEmail,
  sendEmailChangeConfirmationToNewEmail,
} from './account-emails'

beforeEach(() => {
  mockSendEmail.mockReset()
  mockSendEmail.mockResolvedValue({ ok: true })
})

describe('sendPasswordChangeNotificationEmail', () => {
  const date = new Date('2026-03-15T14:30:00Z')

  it('sends to the correct address with the right subject', async () => {
    await sendPasswordChangeNotificationEmail('user@example.com', date)

    expect(mockSendEmail).toHaveBeenCalledOnce()
    const opts = mockSendEmail.mock.calls[0][0]
    expect(opts.to).toBe('user@example.com')
    expect(opts.subject).toBe('Trueke - Your password was changed')
  })

  it('includes the date and time of the change', async () => {
    await sendPasswordChangeNotificationEmail('user@example.com', date)

    const html: string = mockSendEmail.mock.calls[0][0].html
    expect(html).toContain('March 15, 2026')
  })

  it('includes a recommendation to secure the account', async () => {
    await sendPasswordChangeNotificationEmail('user@example.com', date)

    const html: string = mockSendEmail.mock.calls[0][0].html
    expect(html).toContain('Reset your password')
    expect(html).toContain('support')
  })

  it('returns the sendEmail result', async () => {
    mockSendEmail.mockResolvedValue({ ok: false, error: 'SMTP down' })
    const result = await sendPasswordChangeNotificationEmail('user@example.com', date)
    expect(result).toEqual({ ok: false, error: 'SMTP down' })
  })
})

describe('sendEmailChangeNotificationToOldEmail', () => {
  const date = new Date('2026-04-10T09:00:00Z')

  it('sends to the old email address', async () => {
    await sendEmailChangeNotificationToOldEmail('old@example.com', 'new@example.com', date)

    expect(mockSendEmail).toHaveBeenCalledOnce()
    const opts = mockSendEmail.mock.calls[0][0]
    expect(opts.to).toBe('old@example.com')
    expect(opts.subject).toBe('Trueke - Your email address was changed')
  })

  it('informs that the email was changed and shows the new address', async () => {
    await sendEmailChangeNotificationToOldEmail('old@example.com', 'new@example.com', date)

    const html: string = mockSendEmail.mock.calls[0][0].html
    expect(html).toContain('new@example.com')
    expect(html).toContain('changed')
  })

  it('provides a way to contact support', async () => {
    await sendEmailChangeNotificationToOldEmail('old@example.com', 'new@example.com', date)

    const html: string = mockSendEmail.mock.calls[0][0].html
    expect(html).toContain('support')
    expect(html).toContain('mailto:')
  })
})

describe('sendEmailChangeConfirmationToNewEmail', () => {
  it('sends to the new email address', async () => {
    await sendEmailChangeConfirmationToNewEmail('new@example.com')

    expect(mockSendEmail).toHaveBeenCalledOnce()
    const opts = mockSendEmail.mock.calls[0][0]
    expect(opts.to).toBe('new@example.com')
  })

  it('confirms the new email is now active', async () => {
    await sendEmailChangeConfirmationToNewEmail('new@example.com')

    const html: string = mockSendEmail.mock.calls[0][0].html
    expect(html).toContain('new@example.com')
    expect(html).toContain('active email')
  })
})
