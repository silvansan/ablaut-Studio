import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { EmailAdapter, PayloadRequest, TypedUser } from 'payload'

import { formatTtl, INVITE_TTL_MS, mintAccessToken, RESET_TTL_MS } from '@/lib/access-tokens'

export type SmtpConfig = {
  from: string
  host: string
  pass?: string
  port: number
  user?: string
}

const localConsoleEmailAdapter: EmailAdapter<void> = ({ payload }) => ({
  defaultFromAddress: 'noreply@ablaut.local',
  defaultFromName: 'ablaut',
  name: 'console',
  sendEmail: async (message) => {
    const recipients = Array.isArray(message.to) ? message.to.join(', ') : String(message.to ?? '')
    payload.logger.info({
      msg: `Email attempted without SMTP configuration. To: '${recipients}', Subject: '${message.subject ?? ''}'`,
    })
  },
})

let hasWarnedAboutMissingSmtp = false

type AuthEmailArgs = {
  req: PayloadRequest
  token: string
  user: TypedUser
}

function getBaseUrl() {
  return (
    process.env.PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

type EmailShellArgs = {
  ctaLabel: string
  ctaUrl: string
  details?: string[]
  eyebrow: string
  intro: string
  outro?: string
  title: string
}

const EMAIL_FONT = 'font-family:Arial,Helvetica,sans-serif;'

/**
 * Email-client-safe layout: nested tables, inline styles and solid background colours.
 * Mail clients drop CSS gradients, so a gradient behind white text renders white-on-white.
 * Every coloured surface therefore has a solid `bgcolor` and no text depends on a gradient.
 */
function renderEmailShell(args: EmailShellArgs) {
  const { ctaLabel, ctaUrl, details, eyebrow, intro, outro, title } = args
  const safeUrl = escapeHtml(ctaUrl)

  const detailRows = (details ?? [])
    .map(
      (line) =>
        `<tr><td style="padding:0 0 6px;${EMAIL_FONT}font-size:14px;line-height:1.6;color:#15313a;">${escapeHtml(line)}</td></tr>`,
    )
    .join('')

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#eef5f4;" bgcolor="#eef5f4">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#eef5f4;">${escapeHtml(intro)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#eef5f4" style="background-color:#eef5f4;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #d3e2df;">
            <tr>
              <td bgcolor="#163f35" style="background-color:#163f35;padding:28px 32px;">
                <div style="${EMAIL_FONT}font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#bfe3d3;">${escapeHtml(eyebrow)}</div>
                <h1 style="margin:12px 0 0;${EMAIL_FONT}font-size:26px;line-height:1.25;font-weight:700;color:#ffffff;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;${EMAIL_FONT}color:#15313a;">
                <p style="margin:0 0 20px;${EMAIL_FONT}font-size:16px;line-height:1.65;color:#15313a;">${escapeHtml(intro)}</p>
                ${detailRows ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">${detailRows}</table>` : ''}
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
                  <tr>
                    <td bgcolor="#126bb6" style="background-color:#126bb6;border-radius:8px;">
                      <a href="${safeUrl}" target="_blank" style="display:inline-block;padding:14px 26px;${EMAIL_FONT}font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;">${escapeHtml(ctaLabel)}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;${EMAIL_FONT}font-size:13px;line-height:1.6;color:#4a626b;">If the button does not work, copy and paste this link into your browser:</p>
                <p style="margin:6px 0 0;${EMAIL_FONT}font-size:13px;line-height:1.6;word-break:break-all;"><a href="${safeUrl}" target="_blank" style="color:#126bb6;text-decoration:underline;">${safeUrl}</a></p>
                ${outro ? `<p style="margin:24px 0 0;${EMAIL_FONT}font-size:14px;line-height:1.65;color:#4a626b;">${escapeHtml(outro)}</p>` : ''}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 24px;border-top:1px solid #e3eeec;${EMAIL_FONT}font-size:12px;line-height:1.6;color:#6b7f87;">Sent by ablaut because someone used your email address on an ablaut server.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

/** Plain-text twin of `renderEmailShell`: better deliverability, and works when HTML is blocked. */
function renderEmailText(args: EmailShellArgs) {
  const { ctaLabel, ctaUrl, details, intro, outro, title } = args
  return [
    title,
    '',
    intro,
    ...(details && details.length > 0 ? ['', ...details] : []),
    '',
    `${ctaLabel}:`,
    ctaUrl,
    ...(outro ? ['', outro] : []),
    '',
    '-- ablaut',
  ].join('\n')
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim()
  const port = process.env.SMTP_PORT?.trim()
  const from = process.env.SMTP_FROM?.trim()

  if (!host || !port || !from) {
    return null
  }

  return {
    from,
    host,
    pass: process.env.SMTP_PASS?.trim(),
    port: Number(port),
    user: process.env.SMTP_USER?.trim(),
  }
}

export async function buildEmailAdapter() {
  const smtp = getSmtpConfig()

  if (!smtp) {
    if (!hasWarnedAboutMissingSmtp) {
      console.warn('SMTP is not configured. Auth emails will log to the server console.')
      hasWarnedAboutMissingSmtp = true
    }
    return localConsoleEmailAdapter
  }

  return nodemailerAdapter({
    defaultFromAddress: smtp.from,
    defaultFromName: 'ablaut',
    skipVerify: true,
    transportOptions: {
      auth:
        smtp.user || smtp.pass
          ? {
              pass: smtp.pass,
              user: smtp.user,
            }
          : undefined,
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
    },
  })
}

type InviteEmailInput = {
  activationUrl: string
  email: string
  expiresIn?: string
  inviterName?: string
  organizationName?: string
}

function buildInviteEmailArgs(input: InviteEmailInput): EmailShellArgs {
  const inviter = input.inviterName?.trim()
  const org = input.organizationName?.trim()
  const expiresIn = input.expiresIn ?? formatTtl(INVITE_TTL_MS)

  const lead = inviter
    ? `${inviter} invited you to join ${org ? `${org} on ` : ''}ablaut.`
    : `You were invited to ${org ? `join ${org} on ` : ''}ablaut.`

  return {
    ctaLabel: 'Set your password',
    ctaUrl: input.activationUrl,
    details: [`Account: ${input.email}`, `This link works once and expires in ${expiresIn}.`],
    eyebrow: 'ablaut invitation',
    intro: `${lead} Choose a password to activate your account. You will be signed in right after.`,
    outro: `If the link has expired, open the sign-in page and choose "Lost password?" to get a new one.`,
    title: 'Activate your account',
  }
}

export function generateInvitedUserActivationEmailHTML(input: InviteEmailInput) {
  return renderEmailShell(buildInviteEmailArgs(input))
}

export function generateInvitedUserActivationEmailText(input: InviteEmailInput) {
  return renderEmailText(buildInviteEmailArgs(input))
}

export function generateInvitedUserActivationEmailSubject() {
  return 'Activate your ablaut account'
}

function buildResetEmailArgs(args: { email: string; resetUrl: string }): EmailShellArgs {
  return {
    ctaLabel: 'Choose a new password',
    ctaUrl: args.resetUrl,
    details: [`Account: ${args.email}`, `This link works once and expires in ${formatTtl(RESET_TTL_MS)}.`],
    eyebrow: 'ablaut security',
    intro: `A password reset was requested for ${args.email}. Use the button below to choose a new password.`,
    outro: 'If you did not request this, you can safely ignore this email. Your password will not change.',
    title: 'Reset your password',
  }
}

export function generateResetPasswordEmailHTML(args: { email: string; resetUrl: string }) {
  return renderEmailShell(buildResetEmailArgs(args))
}

export function generateResetPasswordEmailText(args: { email: string; resetUrl: string }) {
  return renderEmailText(buildResetEmailArgs(args))
}

/**
 * Payload's "verify" email is sent when an account is created from the Payload admin.
 * Its own verification token cannot set a password, so we mint a real 7-day set-password
 * link instead and send that. Opening it activates the account (see completeUserActivation).
 */
export async function generateVerificationEmailHTML({ req, user }: AuthEmailArgs) {
  const email = typeof user.email === 'string' ? user.email : ''
  let activationUrl = joinUrl(getBaseUrl(), '/forgot-password')

  try {
    const token = await mintAccessToken(req.payload, email, 'invite', req)
    activationUrl = joinUrl(getBaseUrl(), `/reset-password/${token}`)
  } catch (error) {
    req.payload.logger.error({ err: error, msg: 'Could not mint an activation link for the verification email.' })
  }

  return generateInvitedUserActivationEmailHTML({ activationUrl, email })
}

export function generateVerificationEmailSubject() {
  return generateInvitedUserActivationEmailSubject()
}

export function generateForgotPasswordEmailHTML({ token, user }: Partial<AuthEmailArgs> = {}) {
  const email = typeof user?.email === 'string' ? user.email : 'your account'
  return generateResetPasswordEmailHTML({
    email,
    resetUrl: joinUrl(getBaseUrl(), `/reset-password/${token ?? ''}`),
  })
}

export function generateForgotPasswordEmailSubject() {
  return 'Reset your ablaut password'
}

export function generateOrganizationRequestEmailHTML(args: {
  manageUrl: string
  organizationName: string
  requesterEmail: string
}) {
  return renderEmailShell({
    ctaLabel: 'Review request',
    ctaUrl: args.manageUrl,
    eyebrow: 'ablaut organization',
    intro: `${args.requesterEmail} requested to join ${args.organizationName}. Review the request in user management.`,
    title: 'New organization membership request',
  })
}

export function generateOrganizationRequestEmailSubject(args: { organizationName: string }) {
  return `ablaut membership request: ${args.organizationName}`
}

export function generateOrganizationMembershipApprovedEmailHTML(args: {
  dashboardUrl: string
  organizationName: string
  recipientEmail: string
}) {
  return renderEmailShell({
    ctaLabel: 'Open dashboard',
    ctaUrl: args.dashboardUrl,
    eyebrow: 'ablaut organization',
    intro: `Your request to join ${args.organizationName} was approved. You can sign in and work with that organization's events.`,
    title: 'Membership approved',
  })
}

export function generateOrganizationMembershipApprovedEmailSubject(args: { organizationName: string }) {
  return `You were added to ${args.organizationName}`
}

export function generateOrganizationMembershipRejectedEmailHTML(args: {
  organizationName: string
  recipientEmail: string
}) {
  return renderEmailShell({
    ctaLabel: 'Sign in',
    ctaUrl: joinUrl(getBaseUrl(), '/'),
    eyebrow: 'ablaut organization',
    intro: `Your request to join ${args.organizationName} was not approved. Contact the organization manager if you think this was a mistake.`,
    title: 'Membership request declined',
  })
}

export function generateOrganizationMembershipRejectedEmailSubject(args: { organizationName: string }) {
  return `Membership request: ${args.organizationName}`
}

export function generateSpeakerPasswordChangedEmailHTML(args: {
  channelName?: string
  eventTitle?: string
  manageUrl: string
  recipientEmail: string
}) {
  const scope = [args.eventTitle, args.channelName].filter(Boolean).join(' / ') || 'an ablaut speaker page'

  return renderEmailShell({
    ctaLabel: 'Review event',
    ctaUrl: args.manageUrl,
    eyebrow: 'ablaut security',
    intro: `The speaker password for ${scope} was changed. This notice was sent to ${args.recipientEmail}.`,
    outro: 'If this was unexpected, review event assignments and speaker links.',
    title: 'Speaker password changed',
  })
}

export function generateSpeakerPasswordChangedEmailSubject() {
  return 'ablaut speaker password changed'
}

export function generateEventAssignmentEmailHTML(args: {
  eventTitle: string
  eventUrl: string
  recipientEmail: string
  roleForEvent: string
}) {
  return renderEmailShell({
    ctaLabel: 'Open event',
    ctaUrl: args.eventUrl,
    eyebrow: 'ablaut assignment',
    intro: `${args.recipientEmail} was assigned as ${args.roleForEvent} for ${args.eventTitle}.`,
    title: 'You were assigned to an event',
  })
}

export function generateEventAssignmentEmailSubject(args: { eventTitle: string }) {
  return `ablaut event assignment: ${args.eventTitle}`
}

export { getBaseUrl, joinUrl }
