import type { Payload } from 'payload'

import { type AccessLinkKind, formatTtl, getAccessLinkTtlMs, mintAccessToken } from '@/lib/access-tokens'
import {
  generateForgotPasswordEmailSubject,
  generateInvitedUserActivationEmailHTML,
  generateInvitedUserActivationEmailSubject,
  generateInvitedUserActivationEmailText,
  generateResetPasswordEmailHTML,
  generateResetPasswordEmailText,
  getBaseUrl,
  getSmtpConfig,
  joinUrl,
} from '@/lib/email'

export type AccessLinkResult = {
  /** True only when the mail server accepted the message. */
  delivered: boolean
  /** Why delivery did not happen (SMTP missing or rejected). The link is still valid. */
  error?: string
  /** Human label for the link lifetime, e.g. "7 days". */
  expiresIn: string
  /** The one-time set-password link. Treat like a password: never log it. */
  url: string
}

export type InviteContext = {
  inviterName?: string
  organizationName?: string
}

const SMTP_MISSING_MESSAGE = 'Email is not configured on this server (SMTP).'

function buildAccessUrl(token: string) {
  return joinUrl(getBaseUrl(), `/reset-password/${token}`)
}

async function deliver(
  payload: Payload,
  message: { html: string; subject: string; text: string; to: string },
): Promise<Pick<AccessLinkResult, 'delivered' | 'error'>> {
  if (!getSmtpConfig()) {
    return { delivered: false, error: SMTP_MISSING_MESSAGE }
  }

  try {
    await payload.sendEmail(message)
    return { delivered: true }
  } catch (error) {
    payload.logger.error({ err: error, msg: `Could not send an access email to ${message.to}.` })
    return {
      delivered: false,
      error: 'The mail server rejected or could not send the message.',
    }
  }
}

/** Mints a fresh link without sending anything (used by "Copy invite link"). */
export async function createUserAccessLink(
  payload: Payload,
  email: string,
  kind: AccessLinkKind,
): Promise<AccessLinkResult> {
  const token = await mintAccessToken(payload, email, kind)

  return {
    delivered: false,
    expiresIn: formatTtl(getAccessLinkTtlMs(kind)),
    url: buildAccessUrl(token),
  }
}

export async function sendUserPasswordResetEmail(payload: Payload, email: string): Promise<AccessLinkResult> {
  const token = await mintAccessToken(payload, email, 'reset')
  const url = buildAccessUrl(token)

  const delivery = await deliver(payload, {
    html: generateResetPasswordEmailHTML({ email, resetUrl: url }),
    subject: generateForgotPasswordEmailSubject(),
    text: generateResetPasswordEmailText({ email, resetUrl: url }),
    to: email,
  })

  return { ...delivery, expiresIn: formatTtl(getAccessLinkTtlMs('reset')), url }
}

export async function sendUserActivationInviteEmail(
  payload: Payload,
  email: string,
  context: InviteContext = {},
): Promise<AccessLinkResult> {
  const token = await mintAccessToken(payload, email, 'invite')
  const url = buildAccessUrl(token)
  const expiresIn = formatTtl(getAccessLinkTtlMs('invite'))
  const input = { activationUrl: url, email, expiresIn, ...context }

  const delivery = await deliver(payload, {
    html: generateInvitedUserActivationEmailHTML(input),
    subject: generateInvitedUserActivationEmailSubject(),
    text: generateInvitedUserActivationEmailText(input),
    to: email,
  })

  await markInviteIssued(payload, email)

  return { ...delivery, expiresIn, url }
}

/** Keeps "invited <date>" honest after a resend; never blocks the invite itself. */
async function markInviteIssued(payload: Payload, email: string) {
  try {
    await payload.update({
      collection: 'users',
      data: { invitedAt: new Date().toISOString() },
      overrideAccess: true,
      where: { and: [{ email: { equals: email } }, { invitationStatus: { equals: 'pending' } }] },
    })
  } catch (error) {
    payload.logger.warn({ err: error, msg: 'Could not refresh invitedAt after sending an invite.' })
  }
}
