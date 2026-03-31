/**
 * Single source of truth for password rules (registration, change, reset).
 */
export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[?!*&]).{8,}$/

export const NEW_PASSWORD_FORMAT_ERROR_MESSAGE =
  'New password must be 8+ characters, include 1 uppercase letter, 1 number, and 1 special character (?, !, *, &).'

export function isValidPasswordFormat(password: string): boolean {
  return PASSWORD_PATTERN.test(password)
}

/** Empty + format only (no DB). */
export function validateChangePasswordFields(
  currentPassword: string,
  newPassword: string
): string | null {
  if (!currentPassword?.trim()) return 'Current password is required.'
  if (!newPassword?.trim()) return 'New password is required.'
  if (!isValidPasswordFormat(newPassword)) return NEW_PASSWORD_FORMAT_ERROR_MESSAGE
  return null
}

/** For reset flow: new password only. */
export function validateNewPasswordField(newPassword: string): string | null {
  if (!newPassword?.trim()) return 'New password is required.'
  if (!isValidPasswordFormat(newPassword)) return NEW_PASSWORD_FORMAT_ERROR_MESSAGE
  return null
}
