/**
 * Maps raw API/database error messages to user-friendly descriptions.
 * Falls back to a generic message if the error is not recognized.
 */

const ERROR_MAP: { pattern: RegExp; message: string }[] = [
  // Auth errors
  { pattern: /not authenticated|auth|unauthorized|jwt/i, message: "You need to be logged in to do this. Please sign in and try again." },
  { pattern: /permission|forbidden|not allowed/i, message: "You don't have permission to perform this action." },

  // Exchange-specific errors
  { pattern: /same user|yourself|own item/i, message: "You can't trade with yourself." },
  { pattern: /already.*pending|duplicate.*proposal|already.*exist/i, message: "You already have a pending trade proposal for this item." },
  { pattern: /not available|no longer available|item.*inactive|item.*status/i, message: "One or more items are no longer available for trading." },
  { pattern: /expired/i, message: "This trade proposal has expired." },
  { pattern: /already.*accepted|already.*rejected|already.*cancelled/i, message: "This trade proposal has already been resolved." },
  { pattern: /no items|empty.*offer/i, message: "You need to select at least one item to offer." },
  { pattern: /exchange.*not found/i, message: "This trade proposal could not be found. It may have been deleted." },
  { pattern: /initiator.*only|only.*initiator/i, message: "Only the person who created this proposal can cancel it." },

  // Network / connection errors
  { pattern: /fetch|network|timeout|econnrefused|socket/i, message: "Connection error. Please check your internet and try again." },
  { pattern: /rate limit|too many requests/i, message: "Too many requests. Please wait a moment and try again." },

  // Database / server errors
  { pattern: /violates.*constraint|unique.*violation/i, message: "This action conflicts with existing data. Please refresh and try again." },
  { pattern: /internal server|500/i, message: "Something went wrong on our end. Please try again later." },
]

/**
 * Convert a raw error message to a user-friendly string
 */
export function getFriendlyErrorMessage(rawError: string | undefined | null): string {
  if (!rawError) return "Something went wrong. Please try again."

  for (const { pattern, message } of ERROR_MAP) {
    if (pattern.test(rawError)) {
      return message
    }
  }

  // If the error is already short and readable (no stack traces, no technical jargon), use it
  if (rawError.length < 120 && !/^\w+Error:|stack|at \w+/i.test(rawError)) {
    return rawError
  }

  return "Something went wrong. Please try again."
}
