import type { Payload, PayloadRequest } from 'payload'

/** Invitation links stay valid long enough for someone to open the mail days later. */
export const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000
/** Password-reset links are short-lived on purpose. */
export const RESET_TTL_MS = 60 * 60 * 1000

export type AccessLinkKind = 'invite' | 'reset'

export function getAccessLinkTtlMs(kind: AccessLinkKind) {
  return kind === 'invite' ? INVITE_TTL_MS : RESET_TTL_MS
}

export function formatTtl(ms: number) {
  const hours = Math.round(ms / (60 * 60 * 1000))
  if (hours >= 48) {
    return `${Math.round(hours / 24)} days`
  }
  return hours === 1 ? '1 hour' : `${hours} hours`
}

/**
 * Mints a one-time set-password token. Invites and resets share Payload's reset-token
 * machinery; only the lifetime differs. The collection config must NOT set
 * `auth.forgotPassword.expiration`, because that value overrides this per-call one.
 */
export async function mintAccessToken(
  payload: Payload,
  email: string,
  kind: AccessLinkKind,
  req?: PayloadRequest,
) {
  const token = await payload.forgotPassword({
    collection: 'users',
    data: { email },
    disableEmail: true,
    expiration: getAccessLinkTtlMs(kind),
    overrideAccess: true,
    req,
  })

  if (!token) {
    throw new Error('Could not create an access token for this user.')
  }

  return token
}

export type AccessTokenStatus =
  | { state: 'invalid' }
  | { email: string; kind: AccessLinkKind; name?: string; state: 'valid' }

/**
 * Checks a token without consuming it, using the same lookup Payload's resetPassword
 * operation performs. Lets the page show a friendly state before the user types a password.
 */
export async function getAccessTokenStatus(payload: Payload, token: string): Promise<AccessTokenStatus> {
  const trimmed = token.trim()
  if (!trimmed || trimmed.length > 200) {
    return { state: 'invalid' }
  }

  try {
    const user = (await payload.db.findOne({
      collection: 'users',
      where: {
        resetPasswordExpiration: { greater_than: new Date().toISOString() },
        resetPasswordToken: { equals: trimmed },
      },
    })) as null | {
      _verified?: boolean | null
      email?: string
      invitationStatus?: string
      name?: null | string
    }

    if (!user || typeof user.email !== 'string') {
      return { state: 'invalid' }
    }

    return {
      email: user.email,
      kind: user.invitationStatus === 'pending' || user._verified === false ? 'invite' : 'reset',
      name: typeof user.name === 'string' && user.name.trim() ? user.name.trim() : undefined,
      state: 'valid',
    }
  } catch {
    return { state: 'invalid' }
  }
}
