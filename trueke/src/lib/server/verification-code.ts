/** Shared 6-digit numeric code for email change and password recovery. */
export function generateSixDigitCode(): string {
  return Array.from({ length: 6 }, () => Math.floor(Math.random() * 10).toString()).join('')
}
