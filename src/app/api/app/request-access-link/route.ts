import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { consumeRateLimit, rateLimitRequest } from '@/lib/rate-limit'
import { sendUserActivationInviteEmail, sendUserPasswordResetEmail } from '@/lib/user-management'

const GENERIC_RESPONSE = {
  message: 'If an active account uses that email, a new link is on its way. Check your inbox and spam folder.',
}

/**
 * Self-service "send me a new link" for expired invitations and forgotten passwords.
 * Always answers the same way so it cannot be used to discover which emails have accounts,
 * and sends in the background so response time does not leak it either.
 */
export async function POST(request: Request) {
  const rateLimited = rateLimitRequest(request, 'request-access-link', {
    limit: 8,
    windowMs: 10 * 60_000,
  })

  if (rateLimited) {
    return rateLimited
  }

  let email = ''

  try {
    const body = (await request.json()) as { email?: unknown }
    email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email || email.length > 254 || !email.includes('@')) {
    return NextResponse.json({ error: 'Enter the email address of your account.' }, { status: 400 })
  }

  // Per-address cap stops someone from mail-bombing a victim from many IPs.
  if (!consumeRateLimit(`access-link-email:${email}`, { limit: 3, windowMs: 15 * 60_000 })) {
    return NextResponse.json(GENERIC_RESPONSE)
  }

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: { email: { equals: email } },
  })

  const user = result.docs[0]

  if (user && user.active !== false) {
    const awaitingActivation = user.invitationStatus === 'pending' || user._verified === false
    const send = awaitingActivation
      ? sendUserActivationInviteEmail(payload, user.email)
      : sendUserPasswordResetEmail(payload, user.email)

    void send.catch((error) => {
      payload.logger.error({ err: error, msg: 'Could not send a requested access link.' })
    })
  }

  return NextResponse.json(GENERIC_RESPONSE)
}
