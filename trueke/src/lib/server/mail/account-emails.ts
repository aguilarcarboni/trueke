import { sendEmail } from '@/lib/email'

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@trueke.app'

export async function sendPasswordChangeNotificationEmail(
  to: string,
  changedAt: Date
): Promise<{ ok: boolean; error?: string }> {
  const dateStr = changedAt.toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  })

  return sendEmail({
    to,
    subject: 'Trueke - Your password was changed',
    html: `
      <p>Hello,</p>
      <p>Your Trueke account password was successfully changed on <strong>${dateStr} (UTC)</strong>.</p>
      <p>If you made this change, no further action is needed.</p>
      <p>If you did <strong>not</strong> initiate this change, we recommend you immediately:</p>
      <ul>
        <li>Reset your password using the "Forgot password" option on the login page.</li>
        <li>Contact our support team at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</li>
      </ul>
      <p>— The Trueke Team</p>
    `,
  })
}

export async function sendEmailChangeNotificationToOldEmail(
  oldEmail: string,
  newEmail: string,
  changedAt: Date
): Promise<{ ok: boolean; error?: string }> {
  const dateStr = changedAt.toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'UTC',
  })

  return sendEmail({
    to: oldEmail,
    subject: 'Trueke - Your email address was changed',
    html: `
      <p>Hello,</p>
      <p>The email address associated with your Trueke account was changed to <strong>${newEmail}</strong> on <strong>${dateStr} (UTC)</strong>.</p>
      <p>If you made this change, no further action is needed.</p>
      <p>If you did <strong>not</strong> authorize this change, please contact our support team immediately at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a> so we can help secure your account.</p>
      <p>— The Trueke Team</p>
    `,
  })
}

export async function sendEmailChangeConfirmationToNewEmail(
  newEmail: string
): Promise<{ ok: boolean; error?: string }> {
  return sendEmail({
    to: newEmail,
    subject: 'Trueke - Welcome to your new email address',
    html: `
      <p>Hello,</p>
      <p>This email address (<strong>${newEmail}</strong>) is now the active email for your Trueke account.</p>
      <p>You will receive all future notifications and communications at this address.</p>
      <p>If you have any questions, contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
      <p>— The Trueke Team</p>
    `,
  })
}

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
