import * as nodemailer from 'nodemailer'

/** Default "from" address. Set EMAIL_FROM in .env.local (e.g. "Trueke <noreply@yourdomain.com>"). */
const DEFAULT_FROM = process.env.EMAIL_FROM ?? 'Trueke <noreply@localhost>'

export type SendEmailOptions = {
  to: string | string[]
  subject: string
  html: string
  from?: string
}

/**
 * Create transporter from env. Supports either:
 * - SMTP_URL (e.g. smtps://user:pass@smtp.gmail.com:465)
 * - Or SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
 */
function getTransporter() {
  if (process.env.SMTP_URL) {
    return nodemailer.createTransport(process.env.SMTP_URL)
  }
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587
  const secure = process.env.SMTP_SECURE === 'true'
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  if (!host || !user || !pass) {
    return null
  }
  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } })
}

/**
 * Send an email via Nodemailer (SMTP). Use in Server Actions or API routes only.
 * Configure in .env.local: either SMTP_URL or SMTP_HOST + SMTP_USER + SMTP_PASS (and optionally SMTP_PORT, SMTP_SECURE).
 * For Gmail: use an App Password and SMTP_URL=smtps://you@gmail.com:apppassword@smtp.gmail.com:465
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = DEFAULT_FROM,
}: SendEmailOptions): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter()
  if (!transporter) {
    console.error('Email not configured: set SMTP_URL or SMTP_HOST + SMTP_USER + SMTP_PASS in .env.local')
    return { ok: false, error: 'Email is not configured.' }
  }

  const toList = Array.isArray(to) ? to : [to]
  try {
    await transporter.sendMail({
      from,
      to: toList,
      subject,
      html,
    })
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('Nodemailer error:', err)
    return { ok: false, error: message }
  }
}