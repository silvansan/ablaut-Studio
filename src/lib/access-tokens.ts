import type { Payload, PayloadRequest } from 'payload'

const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

/** Defaults: invitation links stay valid long enough to open the mail days later; resets are short. */
export const INVITE_TTL_MS = 7 * 24 * HOUR_MS
export const RESET_TTL_MS = HOUR_MS

export type AccessLinkKind = 'invite' | 'reset'

function readBoundedNumber(name: string, unitMs: number, bounds: { max: number; min: number }, fallbackMs: number) {
  const raw = process.env[name]?.trim()
  const value = raw ? Number(raw) : NaN

  if (!Number.isFinite(value) || value < bounds.min || value > bounds.max) {
    return fallbackMs
  }

  return Math.round(value * unitMs)
}

/**
 * Link lifetimes can be tuned per deployment (Portainer environment variables):
 *   INVITE_LINK_TTL_HOURS    1 to 720 (30 days), default 168 (7 days)
 *   RESET_LINK_TTL_MINUTES   5 to 1440 (24 hours), default 60
 * Out-of-range or non-numeric values fall back to the defaults.
 */
export function getAccessLinkTtlMs(kind: AccessLinkKind) {
  return kind === 'invite'
    ? readBoundedNumber('INVITE_LINK_TTL_HOURS', HOUR_MS, { max: 720, min: 1 }, INVITE_TTL_MS)
    : readBoundedNumber('RESET_LINK_TTL_MINUTES', MINUTE_MS, { max: 1440, min: 5 }, RESET_TTL_MS)
}

export function formatTtl(ms: number) {
  const minutes = Math.round(ms / MINUTE_MS)

  if (minutes < 60) {
    return minutes === 1 ? '1 minute' : `${minutes} minutes`
  }

  const hours = Math.round(minutes / 60)

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
