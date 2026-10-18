import configPromise from '@payload-config'
import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { sendUserActivationInviteEmail } from '@/lib/user-management'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'
import { rateLimitRequest } from '@/lib/rate-limit'

type InviteUserBody = {
  email?: unknown
  name?: unknown
  role?: unknown
}

function parseString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function parseRole(value: unknown, inviterRole: string | null | undefined): 'admin' | 'moderator' {
  if (inviterRole === 'super_admin' && value === 'admin') {
    return 'admin'
  }

  return 'moderator'
}

async function readBody(request: Request): Promise<InviteUserBody> {
  try {
    return (await request.json()) as InviteUserBody
  } catch {
    return {}
  }
}

export async function POST(request: Request) {
  const rateLimited = rateLimitRequest(request, 'user-invite', {
    limit: 10,
    windowMs: 60_000,
  })

  if (rateLimited) {
    return rateLimited
  }

  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!isAdminUser(user)) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = await readBody(request)
  const email = parseString(body.email)?.toLowerCase()
  const name = parseString(body.name)

  if (!email || !name) {
    return NextResponse.json({ error: 'email and name are required' }, { status: 400 })
  }

  const existingUsers = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      email: {
        equals: email,
      },
    },
  })

  if (existingUsers.docs.length > 0) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
  }

  const role = parseRole(body.role, user?.role)
  const temporaryPassword = randomBytes(32).toString('base64url')
  const invitedAt = new Date().toISOString()

  const invitedUser = await payload.create({
    collection: 'users',
    data: {
      _verified: false,
      active: true,
      email,
      invitationStatus: 'pending',
      invitedAt,
      invitedBy: user?.id,
      name,
      password: temporaryPassword,
      role,
    },
    disableVerificationEmail: true,
    overrideAccess: true,
  })

  const delivery = await sendUserActivationInviteEmail(payload, email, {
    inviterName: user?.name || user?.email,
  })

  return NextResponse.json(
    {
      emailDelivered: delivery.delivered,
      ...(delivery.error ? { emailError: delivery.error } : {}),
      id: invitedUser.id,
      invitationStatus: invitedUser.invitationStatus,
      role: invitedUser.role,
    },
    { status: isSuperAdminUser(user) ? 201 : 202 },
  )
}
