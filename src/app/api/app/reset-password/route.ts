import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { MIN_PASSWORD_LENGTH } from '@/lib/password-policy'
import { completeUserActivation } from '@/lib/user-activation'
import { rateLimitRequest } from '@/lib/rate-limit'

type ResetPasswordBody = {
  password?: unknown
  token?: unknown
}

function parseToken(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

export async function POST(request: Request) {
  const rateLimited = rateLimitRequest(request, 'reset-password', {
    limit: 10,
    windowMs: 10 * 60_000,
  })

  if (rateLimited) {
    return rateLimited
  }

  let body: ResetPasswordBody = {}

  try {
    body = (await request.json()) as ResetPasswordBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // The password is deliberately NOT trimmed: login sends it verbatim, so trimming here
  // would silently store a different password than the one the person typed.
  const password = typeof body.password === 'string' ? body.password : null
  const token = parseToken(body.token)

  if (!password || !token) {
    return NextResponse.json({ error: 'Choose a password to continue.' }, { status: 400 })
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    )
  }

  const payload = await getPayload({ config: configPromise })

  let userID: null | number | string = null
  let email: null | string = null

  try {
    const result = await payload.resetPassword({
      collection: 'users',
      data: {
        password,
        token,
      },
      overrideAccess: true,
    })

    userID = (result?.user?.id as number | string | undefined) ?? null
    email = typeof result?.user?.email === 'string' ? result.user.email : null
  } catch {
    return NextResponse.json(
      { code: 'invalid_token', error: 'This link has expired or was already used. Request a new one.' },
      { status: 400 },
    )
  }

  if (userID !== null) {
    try {
      await completeUserActivation(payload, userID)
    } catch (error) {
      payload.logger.error({ err: error, msg: 'Password was set but account activation failed.' })
      return NextResponse.json(
        {
          code: 'activation_failed',
          error: 'Your password was saved, but the account could not be activated. Ask an administrator for help.',
        },
        { status: 500 },
      )
    }
  }

  return NextResponse.json({ email, message: 'Password saved.' })
}
