import { afterEach, describe, expect, it } from 'vitest'

import { formatTtl, getAccessLinkTtlMs, INVITE_TTL_MS, RESET_TTL_MS } from '@/lib/access-tokens'
import {
  generateForgotPasswordEmailHTML,
  generateInvitedUserActivationEmailHTML,
  generateInvitedUserActivationEmailText,
  generateResetPasswordEmailHTML,
  generateResetPasswordEmailText,
} from '@/lib/email'
import { checkNewPassword, MIN_PASSWORD_LENGTH } from '@/lib/password-policy'
import { loginFailureMessage } from '@/lib/user-activation'

const activationUrl = 'https://voice.example.org/reset-password/abc123def456'

describe('invite email', () => {
  const html = generateInvitedUserActivationEmailHTML({
    activationUrl,
    email: 'new.person@example.org',
    inviterName: 'Alex Admin',
    organizationName: 'Riverside Church',
  })

  it('never relies on a gradient, which mail clients strip (white text on white)', () => {
    expect(html).not.toContain('gradient')
  })

  it('gives the header and the button solid background colours behind white text', () => {
    expect(html).toContain('bgcolor="#163f35"')
    expect(html).toContain('bgcolor="#126bb6"')
    expect(html).toMatch(/color:#ffffff;">Activate your account<\/h1>/)
  })

  it('has a clickable button and a clickable fallback link, not plain text', () => {
    const anchors = html.match(new RegExp(`<a href="${activationUrl}"`, 'g')) ?? []
    expect(anchors).toHaveLength(2)
  })

  it('names the inviter, the organization and the lifetime', () => {
    expect(html).toContain('Alex Admin invited you to join Riverside Church on ablaut')
    expect(html).toContain('expires in 7 days')
  })

  it('escapes names so an inviter cannot inject markup', () => {
    const hostile = generateInvitedUserActivationEmailHTML({
      activationUrl,
      email: 'a@example.org',
      inviterName: '<script>alert(1)</script>',
    })
    expect(hostile).not.toContain('<script>')
    expect(hostile).toContain('&lt;script&gt;')
  })

  it('has a plain-text twin containing the link', () => {
    const text = generateInvitedUserActivationEmailText({ activationUrl, email: 'a@example.org' })
    expect(text).toContain(activationUrl)
    expect(text).not.toMatch(/<[a-z]/i)
  })
})

describe('reset email', () => {
  it('uses the same safe layout and states the 1 hour lifetime', () => {
    const html = generateResetPasswordEmailHTML({ email: 'a@example.org', resetUrl: activationUrl })
    expect(html).not.toContain('gradient')
    expect(html).toContain('expires in 1 hour')
    expect(generateResetPasswordEmailText({ email: 'a@example.org', resetUrl: activationUrl })).toContain(
      activationUrl,
    )
  })

  it('builds the Payload forgot-password email from the token', () => {
    const html = generateForgotPasswordEmailHTML({ token: 'tok123', user: { email: 'a@example.org' } as never })
    expect(html).toContain('/reset-password/tok123')
  })
})

describe('access link lifetimes', () => {
  afterEach(() => {
    delete process.env.INVITE_LINK_TTL_HOURS
    delete process.env.RESET_LINK_TTL_MINUTES
  })

  it('reads the lifetimes from the environment', () => {
    process.env.INVITE_LINK_TTL_HOURS = '72'
    process.env.RESET_LINK_TTL_MINUTES = '15'
    expect(formatTtl(getAccessLinkTtlMs('invite'))).toBe('3 days')
    expect(formatTtl(getAccessLinkTtlMs('reset'))).toBe('15 minutes')
  })

  it('ignores out-of-range and non-numeric values', () => {
    process.env.INVITE_LINK_TTL_HOURS = '99999'
    process.env.RESET_LINK_TTL_MINUTES = 'soon'
    expect(getAccessLinkTtlMs('invite')).toBe(INVITE_TTL_MS)
    expect(getAccessLinkTtlMs('reset')).toBe(RESET_TTL_MS)
  })

  it('keeps invites for a week and resets for an hour by default', () => {
    expect(getAccessLinkTtlMs('invite')).toBe(INVITE_TTL_MS)
    expect(getAccessLinkTtlMs('reset')).toBe(RESET_TTL_MS)
    expect(formatTtl(INVITE_TTL_MS)).toBe('7 days')
    expect(formatTtl(RESET_TTL_MS)).toBe('1 hour')
  })
})

describe('password policy', () => {
  it('rejects short passwords and mismatches, accepts a good pair', () => {
    expect(checkNewPassword('short', 'short')).toBe('too_short')
    expect(checkNewPassword('a'.repeat(MIN_PASSWORD_LENGTH), 'different-password')).toBe('mismatch')
    expect(checkNewPassword('correct horse', 'correct horse')).toBeNull()
  })

  it('does not trim, so spaces are part of the password', () => {
    expect(checkNewPassword(' padded pass ', ' padded pass')).toBe('mismatch')
  })
})

describe('login failure messages', () => {
  it('points invited and unverified accounts at their email or a new link', () => {
    expect(loginFailureMessage('invited')).toMatch(/invitation/i)
    expect(loginFailureMessage('invited')).toMatch(/new link/i)
    expect(loginFailureMessage('unverified')).toMatch(/new link/i)
  })

  it('keeps the generic message for unknown accounts', () => {
    expect(loginFailureMessage(null)).toMatch(/did not work/i)
    expect(loginFailureMessage('inactive')).toMatch(/inactive/i)
  })
})
