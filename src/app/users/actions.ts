'use server'

import configPromise from '@payload-config'
import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'

import { canManageAssignment } from '@/app/events/[eventSlug]/settings/actions'
import { requireAppUser } from '@/lib/app-auth'
import {
  canManageUserInOrganization,
  getManageableOrganizationIDs,
  hasOrganizationManagementAccess,
} from '@/lib/organizations'
import { isSuperAdminUser } from '@/lib/permissions'
import {
  generateOrganizationMembershipApprovedEmailHTML,
  generateOrganizationMembershipApprovedEmailSubject,
  generateOrganizationMembershipRejectedEmailHTML,
  generateOrganizationMembershipRejectedEmailSubject,
  getBaseUrl,
  joinUrl,
} from '@/lib/email'
import { revalidateOrganizationPaths } from '@/lib/revalidate-organization-paths'
import { sendUserActivationInviteEmail, sendUserPasswordResetEmail } from '@/lib/user-management'
import { completeUserActivation } from '@/lib/user-activation'

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function numericValue(formData: FormData, key: string): number | undefined {
  const value = stringValue(formData, key)
  const parsed = value ? Number(value) : NaN

  return Number.isFinite(parsed) ? parsed : undefined
}

function roleValue(formData: FormData, canSetAdmin: boolean): 'admin' | 'moderator' {
  return canSetAdmin && stringValue(formData, 'role') === 'admin' ? 'admin' : 'moderator'
}

function updateRoleValue(formData: FormData): 'admin' | 'moderator' | 'super_admin' {
  const role = stringValue(formData, 'role')

  if (role === 'super_admin' || role === 'admin') {
    return role
  }

  return 'moderator'
}

function membershipRoleValue(formData: FormData): 'owner' | 'manager' | 'moderator' {
  const role = stringValue(formData, 'roleInOrganization')

  if (role === 'owner' || role === 'manager') {
    return role
  }

  return 'moderator'
}

function slugifyOrganizationName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function revalidateOrganizationById(
  payload: Awaited<ReturnType<typeof getPayload>>,
  organizationID?: number | null,
) {
  revalidateOrganizationPaths()

  if (!organizationID) {
    return
  }

  const organization = await payload
    .findByID({
      id: organizationID,
      collection: 'organizations',
      depth: 0,
      overrideAccess: true,
    })
    .catch(() => null)

  if (organization?.slug) {
    revalidateOrganizationPaths(organization.slug)
  }
}

async function createOrganizationRecord(
  payload: Awaited<ReturnType<typeof getPayload>>,
  currentUser: Awaited<ReturnType<typeof requireAppUser>>,
  name: string,
  slugInput?: string,
) {
  const slug = slugInput ?? slugifyOrganizationName(name)

  if (!slug) {
    throw new Error('Organization slug could not be generated from the name.')
  }

  return payload.create({
    collection: 'organizations',
    data: {
      active: true,
      createdBy: currentUser.id,
      name,
      slug,
    },
    overrideAccess: true,
    user: currentUser,
  })
}

async function assertCanManageOrganization(
  payload: Awaited<ReturnType<typeof getPayload>>,
  currentUser: Awaited<ReturnType<typeof requireAppUser>>,
  organizationID: number,
) {
  if (isSuperAdminUser(currentUser)) {
    return
  }

  const manageableOrganizationIDs = await getManageableOrganizationIDs({
    payload,
    user: currentUser,
  } as never)

  if (manageableOrganizationIDs === null || manageableOrganizationIDs.includes(organizationID)) {
    return
  }

  throw new Error('You do not have permission to manage this organization.')
}

async function assertCanManageOrganizationUsers(
  payload: Awaited<ReturnType<typeof getPayload>>,
  currentUser: Awaited<ReturnType<typeof requireAppUser>>,
) {
  if (!(await hasOrganizationManagementAccess({ payload, user: currentUser } as never))) {
    throw new Error('You do not have permission to manage organization users.')
  }
}

export async function inviteUserAction(formData: FormData) {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  await assertCanManageOrganizationUsers(payload, currentUser)
  const email = stringValue(formData, 'email')?.toLowerCase()
  const name = stringValue(formData, 'name')
  const organizationChoice = stringValue(formData, 'organizationId')
  let organizationID = numericValue(formData, 'organizationId')

  if (organizationChoice === 'new') {
    if (!isSuperAdminUser(currentUser)) {
      throw new Error('Only super admins can create organizations.')
    }

    const newOrganizationName = stringValue(formData, 'newOrganizationName')

    if (!newOrganizationName) {
      throw new Error('New organization name is required.')
    }

    const organization = await createOrganizationRecord(payload, currentUser, newOrganizationName)
    organizationID = organization.id
  }

  if (!email || !name || !organizationID) {
    throw new Error('Name, email, and organization are required.')
  }

  await assertCanManageOrganization(payload, currentUser, organizationID)

  const temporaryPassword = randomBytes(32).toString('base64url')
  const canSetAdmin = isSuperAdminUser(currentUser)
  const globalRole = canSetAdmin ? roleValue(formData, true) : 'moderator'

  const createdUser = await payload.create({
    collection: 'users',
    data: {
      _verified: false,
      active: true,
      email,
      invitationStatus: 'pending',
      invitedAt: new Date().toISOString(),
      invitedBy: currentUser.id,
      name,
      password: temporaryPassword,
      role: globalRole,
    },
    disableVerificationEmail: true,
    overrideAccess: false,
    user: currentUser,
  })

  await payload.create({
    collection: 'organization-memberships',
    data: {
      invitedAt: new Date().toISOString(),
      invitedBy: currentUser.id,
      organization: organizationID,
      roleInOrganization: membershipRoleValue(formData),
      status: 'pending',
      user: createdUser.id,
    },
    overrideAccess: true,
    user: currentUser,
  })

  await sendUserActivationInviteEmail(payload, email)

  await revalidateOrganizationById(payload, organizationID)
}

export async function updateUserAction(formData: FormData) {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  if (!isSuperAdminUser(currentUser)) {
    await assertCanManageOrganizationUsers(payload, currentUser)
  }

  const id = stringValue(formData, 'id')
  const name = stringValue(formData, 'name')
  const preferredLanguage = stringValue(formData, 'preferredLanguage') ?? 'en'

  if (!id || !name) {
    throw new Error('User ID and name are required.')
  }

  const data = isSuperAdminUser(currentUser)
    ? {
        active: formData.get('active') === 'on',
        name,
        preferredLanguage,
        role: updateRoleValue(formData),
      }
    : {
        name,
        preferredLanguage,
      }

  await payload.update({
    id,
    collection: 'users',
    data,
    overrideAccess: false,
    user: currentUser,
  })

  revalidatePath('/users')
}

export async function sendPasswordResetForUserAction(formData: FormData) {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  await assertCanManageOrganizationUsers(payload, currentUser)

  const userID = stringValue(formData, 'id')
  const organizationID = numericValue(formData, 'organizationId')

  if (!userID) {
    throw new Error('User ID is required.')
  }

  const targetUser = await payload.findByID({
    id: userID,
    collection: 'users',
    overrideAccess: false,
    user: currentUser,
  })

  if (organizationID) {
    const allowed = await canManageUserInOrganization(
      { payload, user: currentUser } as never,
      userID,
      organizationID,
    )

    if (!allowed) {
      throw new Error('You do not have permission to reset this user password.')
    }
  } else if (!isSuperAdminUser(currentUser)) {
    throw new Error('Organization context is required.')
  }

  await sendUserPasswordResetEmail(payload, targetUser.email)

  revalidatePath('/users')
}

export async function resendInviteForUserAction(formData: FormData) {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  await assertCanManageOrganizationUsers(payload, currentUser)

  const userID = stringValue(formData, 'id')
  const organizationID = numericValue(formData, 'organizationId')

  if (!userID || !organizationID) {
    throw new Error('User ID and organization are required.')
  }

  const targetUser = await payload.findByID({
    id: userID,
    collection: 'users',
    overrideAccess: false,
    user: currentUser,
  })

  if (targetUser.invitationStatus !== 'pending') {
    throw new Error('This user is not waiting for activation.')
  }

  const allowed = await canManageUserInOrganization(
    { payload, user: currentUser } as never,
    userID,
    organizationID,
  )

  if (!allowed) {
    throw new Error('You do not have permission to resend this invite.')
  }

  await sendUserActivationInviteEmail(payload, targetUser.email)

  revalidatePath('/users')
}

export async function approveMembershipAction(formData: FormData) {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  await assertCanManageOrganizationUsers(payload, currentUser)

  const membershipID = numericValue(formData, 'membershipId')
  const organizationID = numericValue(formData, 'organizationId')

  if (!membershipID || !organizationID) {
    throw new Error('Membership ID and organization are required.')
  }

  await assertCanManageOrganization(payload, currentUser, organizationID)

  const existingMembership = await payload.findByID({
    id: membershipID,
    collection: 'organization-memberships',
    depth: 1,
    overrideAccess: true,
  })

  const updatedMembership = await payload.update({
    id: membershipID,
    collection: 'organization-memberships',
    data: {
      approvedBy: currentUser.id,
      status: 'active',
    },
    depth: 1,
    overrideAccess: true,
    user: currentUser,
  })

  const approvedUser =
    typeof updatedMembership.user === 'object' ? updatedMembership.user : null
  const organization =
    typeof existingMembership.organization === 'object' ? existingMembership.organization : null

  if (approvedUser?.id) {
    if (approvedUser.invitationStatus === 'pending') {
      await completeUserActivation(payload, approvedUser.id)
    }

    if (approvedUser.email && organization?.name) {
      await payload.sendEmail({
        html: generateOrganizationMembershipApprovedEmailHTML({
          dashboardUrl: joinUrl(getBaseUrl(), '/dashboard'),
          organizationName: organization.name,
          recipientEmail: approvedUser.email,
        }),
        subject: generateOrganizationMembershipApprovedEmailSubject({ organizationName: organization.name }),
        to: approvedUser.email,
      })
    }
  }

  await revalidateOrganizationById(payload, organizationID)
}

export async function rejectMembershipAction(formData: FormData) {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  await assertCanManageOrganizationUsers(payload, currentUser)

  const membershipID = numericValue(formData, 'membershipId')
  const organizationID = numericValue(formData, 'organizationId')

  if (!membershipID || !organizationID) {
    throw new Error('Membership ID and organization are required.')
  }

  await assertCanManageOrganization(payload, currentUser, organizationID)

  const existingMembership = await payload.findByID({
    id: membershipID,
    collection: 'organization-memberships',
    depth: 1,
    overrideAccess: true,
  })

  await payload.update({
    id: membershipID,
    collection: 'organization-memberships',
    data: {
      status: 'rejected',
    },
    overrideAccess: true,
    user: currentUser,
  })

  const requester =
    typeof existingMembership.user === 'object' ? existingMembership.user : null
  const organization =
    typeof existingMembership.organization === 'object' ? existingMembership.organization : null

  if (requester?.email && organization?.name) {
    await payload.sendEmail({
      html: generateOrganizationMembershipRejectedEmailHTML({
        organizationName: organization.name,
        recipientEmail: requester.email,
      }),
      subject: generateOrganizationMembershipRejectedEmailSubject({ organizationName: organization.name }),
      to: requester.email,
    })
  }

  await revalidateOrganizationById(payload, organizationID)
}

export async function removeMembershipAction(formData: FormData) {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  await assertCanManageOrganizationUsers(payload, currentUser)

  const membershipID = numericValue(formData, 'membershipId')
  const organizationID = numericValue(formData, 'organizationId')

  if (!membershipID || !organizationID) {
    throw new Error('Membership ID and organization are required.')
  }

  await assertCanManageOrganization(payload, currentUser, organizationID)

  await payload.update({
    id: membershipID,
    collection: 'organization-memberships',
    data: {
      status: 'revoked',
    },
    overrideAccess: true,
    user: currentUser,
  })

  await revalidateOrganizationById(payload, organizationID)
}

export async function upsertUserOrganizationMembershipAction(formData: FormData) {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  await assertCanManageOrganizationUsers(payload, currentUser)

  const organizationID = numericValue(formData, 'organizationId')
  const targetUserID = numericValue(formData, 'userID')

  if (!organizationID || !targetUserID) {
    throw new Error('User and organization are required.')
  }

  await assertCanManageOrganization(payload, currentUser, organizationID)

  await payload.findByID({
    id: targetUserID,
    collection: 'users',
    overrideAccess: false,
    user: currentUser,
  })

  const existing = await payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    user: currentUser,
    where: {
      and: [
        {
          organization: {
            equals: organizationID,
          },
        },
        {
          user: {
            equals: targetUserID,
          },
        },
      ],
    },
  })

  const data = {
    approvedBy: currentUser.id,
    organization: organizationID,
    roleInOrganization: membershipRoleValue(formData),
    status: 'active' as const,
    user: targetUserID,
  }

  if (existing.docs[0]) {
    await payload.update({
      id: existing.docs[0].id,
      collection: 'organization-memberships',
      data,
      overrideAccess: true,
      user: currentUser,
    })
  } else {
    await payload.create({
      collection: 'organization-memberships',
      data: {
        ...data,
        approvedAt: new Date().toISOString(),
      },
      overrideAccess: true,
      user: currentUser,
    })
  }

  await revalidateOrganizationById(payload, organizationID)
}

export async function deleteUserAction(formData: FormData) {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  await assertCanManageOrganizationUsers(payload, currentUser)

  const id = stringValue(formData, 'id')
  const organizationID = numericValue(formData, 'organizationId')

  if (!id || String(currentUser.id) === id) {
    throw new Error('A valid user other than yourself is required.')
  }

  const targetUser = await payload.findByID({
    id,
    collection: 'users',
    overrideAccess: false,
    user: currentUser,
  })

  if (!isSuperAdminUser(currentUser) && targetUser.role !== 'moderator' && targetUser.role !== 'admin') {
    throw new Error('You can only delete admin or moderator accounts in your organizations.')
  }

  if (organizationID) {
    const allowed = await canManageUserInOrganization(
      { payload, user: currentUser } as never,
      id,
      organizationID,
    )

    if (!allowed) {
      throw new Error('You do not have permission to delete this user.')
    }
  }

  const assignments = await payload.find({
    collection: 'event-assignments',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    user: currentUser,
    where: {
      user: {
        equals: id,
      },
    },
  })

  for (const assignment of assignments.docs) {
    await payload.delete({
      id: assignment.id,
      collection: 'event-assignments',
      overrideAccess: true,
      user: currentUser,
    })
  }

  const memberships = await payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    where: {
      user: {
        equals: id,
      },
    },
  })

  for (const membership of memberships.docs) {
    await payload.delete({
      id: membership.id,
      collection: 'organization-memberships',
      overrideAccess: true,
      user: currentUser,
    })
  }

  await payload.delete({
    id,
    collection: 'users',
    overrideAccess: true,
    user: currentUser,
  })

  await revalidateOrganizationById(payload, organizationID)
}

function booleanValue(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on'
}

function eventRoleValue(formData: FormData): 'admin' | 'moderator' | 'viewer' {
  const value = stringValue(formData, 'roleForEvent')

  if (value === 'admin' || value === 'viewer') {
    return value
  }

  return 'moderator'
}

function permissionsFromForm(formData: FormData) {
  return {
    canCreateChannels: booleanValue(formData, 'canCreateChannels'),
    canDeleteChannels: booleanValue(formData, 'canDeleteChannels'),
    canEditEvent: booleanValue(formData, 'canEditEvent'),
    canManageSpeakerPassword: booleanValue(formData, 'canManageSpeakerPassword'),
    canViewQR: booleanValue(formData, 'canViewQR'),
  }
}

export async function upsertUserEventAssignmentAction(formData: FormData) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const eventID = stringValue(formData, 'eventID')
  const targetUserID = stringValue(formData, 'userID')
  const roleForEvent = eventRoleValue(formData)

  if (!eventID || !targetUserID) {
    throw new Error('Event and user are required.')
  }

  if (!(await canManageAssignment(payload, user, eventID))) {
    throw new Error('You do not have permission to manage assignments for this event.')
  }

  const targetUser = await payload.findByID({
    id: targetUserID,
    collection: 'users',
    overrideAccess: false,
    user,
  })

  if (!isSuperAdminUser(user)) {
    if (roleForEvent === 'admin' || targetUser.role !== 'moderator') {
      throw new Error('Admins can only assign moderators to events.')
    }
  }

  const existing = await payload.find({
    collection: 'event-assignments',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      and: [
        {
          event: {
            equals: Number(eventID),
          },
        },
        {
          user: {
            equals: Number(targetUserID),
          },
        },
      ],
    },
  })

  const data = {
    event: Number(eventID),
    permissions: permissionsFromForm(formData),
    roleForEvent,
    user: Number(targetUserID),
  }

  if (existing.docs[0]) {
    await payload.update({
      id: existing.docs[0].id,
      collection: 'event-assignments',
      data,
      overrideAccess: false,
      user,
    })
  } else {
    await payload.create({
      collection: 'event-assignments',
      data,
      overrideAccess: false,
      user,
    })
  }

  const event = await payload
    .findByID({
      id: eventID,
      collection: 'events',
      depth: 0,
      overrideAccess: true,
      user,
    })
    .catch(() => null)

  revalidatePath('/users')
  if (event?.slug) {
    revalidatePath(`/events/${event.slug}`)
  }
}

export async function deleteUserEventAssignmentAction(formData: FormData) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const assignmentID = stringValue(formData, 'assignmentID')

  if (!assignmentID) {
    throw new Error('Assignment is required.')
  }

  const assignment = await payload.findByID({
    id: assignmentID,
    collection: 'event-assignments',
    overrideAccess: true,
    user,
  })
  const eventID =
    typeof assignment.event === 'number' ? assignment.event : assignment.event?.id

  if (!eventID || !(await canManageAssignment(payload, user, eventID))) {
    throw new Error('You do not have permission to remove this event assignment.')
  }

  await payload.delete({
    id: assignmentID,
    collection: 'event-assignments',
    overrideAccess: true,
    user,
  })

  const event = await payload
    .findByID({
      id: eventID,
      collection: 'events',
      depth: 0,
      overrideAccess: true,
      user,
    })
    .catch(() => null)

  revalidatePath('/users')
  if (event?.slug) {
    revalidatePath(`/events/${event.slug}`)
  }
}
