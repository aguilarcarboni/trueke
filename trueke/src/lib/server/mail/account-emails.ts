import { sendEmail } from '@/lib/email'

export async function sendEmailChangeVerificationEmail(
  to: string,
  code: string,
  pendingEmail: string
): Promise<{ ok: boolean; error?: string }> {
  return sendEmail({
    to,
    subject: 'Trueke - Email change confirmation',
    html: `
      <p>Your Trueke email change verification code is:</p>
      <p><strong>${code}</strong></p>
      <p>Use this code to confirm your new email: ${pendingEmail}</p>
      <p>This code expires in 5 minutes.</p>
      <p>If you did not request this change, please ignore this email.</p>
    `,
  })
}

export async function sendPasswordRecoveryEmail(
  to: string,
  code: string,
  normalizedEmail: string
): Promise<{ ok: boolean; error?: string }> {
  return sendEmail({
    to,
    subject: 'Trueke - Password recovery',
    html: `
      <p>Your Trueke password recovery code is:</p>
      <p><strong>${code}</strong></p>
      <p>Use this code to recover your password: ${normalizedEmail}</p>
      <p>This code expires in 5 minutes.</p>
      <p>If you did not request this recovery, please ignore this email.</p>
    `,
  })
}
