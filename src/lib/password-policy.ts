/** Shared by the set-password form (client) and the reset endpoint (server). */
export const MIN_PASSWORD_LENGTH = 8

export type PasswordProblem = 'too_short' | 'mismatch' | null

export function checkNewPassword(password: string, confirmation: string): PasswordProblem {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return 'too_short'
  }

  if (password !== confirmation) {
    return 'mismatch'
  }

  return null
}
