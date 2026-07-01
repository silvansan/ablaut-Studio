import type { Payload } from 'payload'

export async function completeUserActivation(
  payload: Payload,
  userID: number | string,
  options?: { markInvitationAccepted?: boolean },
) {
  const user = await payload.findByID({
    collection: 'users',
    id: userID,
    overrideAccess: true,
  })

  const markInvitation = options?.markInvitationAccepted ?? user.invitationStatus === 'pending'

  await payload.update({
    collection: 'users',
    id: userID,
    data: {
      _verified: true,
      active: user.active === false ? true : user.active ?? true,
      ...(markInvitation
        ? {
            invitationAcceptedAt: new Date().toISOString(),
            invitationStatus: 'accepted' as const,
          }
        : {}),
    },
    overrideAccess: true,
  })

  const pendingInvitedMemberships = await payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        {
          user: {
            equals: userID,
          },
        },
        {
          status: {
            equals: 'pending',
          },
        },
        {
          invitedBy: {
            exists: true,
          },
        },
      ],
    },
  })

  const approvedAt = new Date().toISOString()

  for (const membership of pendingInvitedMemberships.docs) {
    await payload.update({
      collection: 'organization-memberships',
      id: membership.id,
      data: {
        approvedAt,
        approvedBy: membership.invitedBy ?? undefined,
        status: 'active',
      },
      overrideAccess: true,
    })
  }
}

export type LoginFailureReason = 'invalid' | 'inactive' | 'unverified'

export async function getLoginFailureReason(
  payload: Payload,
  email: string,
): Promise<LoginFailureReason | null> {
  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      email: {
        equals: email.toLowerCase(),
      },
    },
  })

  const user = result.docs[0]

  if (!user) {
    return null
  }

  if (user.active === false) {
    return 'inactive'
  }

  if (user._verified === false) {
    return 'unverified'
  }

  return null
}

export function loginFailureMessage(reason: LoginFailureReason | null): string {
  if (reason === 'inactive') {
    return 'This account is inactive. Contact a super admin for access.'
  }

  if (reason === 'unverified') {
    return 'This account is not verified yet. Use the activation or password reset link from your email.'
  }

  return 'The email or password did not work. Check the account and try again.'
}
