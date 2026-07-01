import type { Payload, PayloadRequest, Where } from 'payload'

import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'
import type { OrganizationMembership, User } from '@/payload-types'

export type OrganizationRole = 'owner' | 'manager' | 'moderator' | 'viewer'
export type OrganizationMembershipStatus = 'pending' | 'active' | 'rejected' | 'revoked'

export function isOrganizationManagerRole(role: string | null | undefined): boolean {
  return role === 'owner' || role === 'manager'
}

/** Super admins and platform admins operate across all organizations. */
export function hasPlatformWideOrganizationAccess(user: User | null | undefined): boolean {
  return isAdminUser(user)
}

export const INVITABLE_ORGANIZATION_ROLES = [
  { description: 'Manage members, events, and settings in this organization.', label: 'Manager', value: 'manager' },
  {
    description: 'Operate assigned events and channels. Most helpers use this role.',
    label: 'Moderator',
    value: 'moderator',
  },
] as const

function normalizeRelationshipID(value: number | string | { id?: number | string } | null | undefined) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return value.id ?? null
  }

  return null
}

function uniqueIDs(ids: Array<number | string>): Array<number | string> {
  return [...new Set(ids.map((value) => String(value)))].map((value) => {
    const numericValue = Number(value)
    return Number.isNaN(numericValue) ? value : numericValue
  })
}

export async function getActiveMembershipsForUser(req: PayloadRequest, userID?: number | string | null) {
  const comparableUserID = normalizeRelationshipID(userID ?? req.user?.id)

  if (!comparableUserID) {
    return [] as OrganizationMembership[]
  }

  const result = await req.payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          user: {
            equals: comparableUserID,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  return result.docs
}

export function countUniqueActiveOrganizations(memberships: OrganizationMembership[]): number {
  const organizationIDs = memberships
    .map((membership) => normalizeRelationshipID(membership.organization))
    .filter((value): value is number | string => value !== null)

  return uniqueIDs(organizationIDs).length
}

export async function countActiveOrganizationsForUser(payload: Payload, userID: number | string) {
  const memberships = await getActiveMembershipsForUser(
    { payload, user: { id: userID } } as PayloadRequest,
    userID,
  )

  return countUniqueActiveOrganizations(memberships)
}

/** Show Events / Organizations nav when user spans multiple orgs or is a platform operator. */
export function shouldShowMultiOrganizationNav(user: User | null | undefined, activeOrganizationCount: number) {
  if (!user) {
    return false
  }

  if (hasPlatformWideOrganizationAccess(user)) {
    return true
  }

  return activeOrganizationCount > 1
}

export async function getManageableOrganizationIDs(req: PayloadRequest) {
  if (hasPlatformWideOrganizationAccess(req.user as User | undefined)) {
    return null
  }

  const memberships = await getActiveMembershipsForUser(req)
  const managedOrganizationIDs = memberships
    .filter((membership) => isOrganizationManagerRole(membership.roleInOrganization))
    .map((membership) => normalizeRelationshipID(membership.organization))
    .filter((value): value is number | string => value !== null)

  return uniqueIDs(managedOrganizationIDs)
}

export async function hasOrganizationManagementAccess(req: PayloadRequest): Promise<boolean> {
  if (!req.user) {
    return false
  }

  if (hasPlatformWideOrganizationAccess(req.user as User)) {
    return true
  }

  const memberships = await getActiveMembershipsForUser(req)

  return memberships.some((membership) => isOrganizationManagerRole(membership.roleInOrganization))
}

export async function countPendingJoinRequestsForUser(payload: Payload, user: User): Promise<number> {
  const req = { payload, user } as PayloadRequest
  const organizationIDs = await getManageableOrganizationIDs(req)

  if (organizationIDs !== null && organizationIDs.length === 0) {
    return 0
  }

  const result = await payload.count({
    collection: 'organization-memberships',
    overrideAccess: true,
    where: {
      and: [
        {
          status: {
            equals: 'pending',
          },
        },
        {
          requestedBy: {
            exists: true,
          },
        },
        ...(organizationIDs
          ? [
              {
                organization: {
                  in: organizationIDs,
                },
              },
            ]
          : []),
      ],
    },
  })

  return result.totalDocs
}

export async function getMemberOrganizationIDs(
  req: PayloadRequest,
  roles: OrganizationRole[] = ['owner', 'manager', 'moderator'],
) {
  if (hasPlatformWideOrganizationAccess(req.user as User | undefined)) {
    return null
  }

  const memberships = await getActiveMembershipsForUser(req)
  const organizationIDs = memberships
    .filter((membership) => roles.includes(membership.roleInOrganization as OrganizationRole))
    .map((membership) => normalizeRelationshipID(membership.organization))
    .filter((value): value is number | string => value !== null)

  return uniqueIDs(organizationIDs)
}

export async function getManageableOrganizationWhere(req: PayloadRequest): Promise<Where | true | false> {
  const organizationIDs = await getManageableOrganizationIDs(req)

  if (organizationIDs === null) {
    return true
  }

  if (organizationIDs.length === 0) {
    return false
  }

  return {
    id: {
      in: organizationIDs,
    },
  }
}

export async function getVisibleUserIDsForRequest(req: PayloadRequest): Promise<Array<number | string> | null> {
  if (hasPlatformWideOrganizationAccess(req.user as User | undefined)) {
    return null
  }

  const organizationIDs = await getManageableOrganizationIDs(req)

  if (organizationIDs === null) {
    return null
  }

  if (organizationIDs.length === 0) {
    return req.user?.id ? [req.user.id] : []
  }

  const memberships = await req.payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 2000,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          organization: {
            in: organizationIDs,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  const userIDs = memberships.docs
    .map((membership) => normalizeRelationshipID(membership.user))
    .filter((value): value is number | string => value !== null)

  const currentUserID = normalizeRelationshipID(req.user?.id)

  if (currentUserID) {
    userIDs.push(currentUserID)
  }

  return uniqueIDs(userIDs)
}

export async function canManageUserInOrganization(
  req: PayloadRequest,
  targetUserID: number | string,
  organizationID: number | string,
) {
  if (hasPlatformWideOrganizationAccess(req.user as User | undefined)) {
    return true
  }

  const manageableOrganizationIDs = await getManageableOrganizationIDs(req)

  if (!manageableOrganizationIDs?.includes(organizationID)) {
    return false
  }

  const membership = await req.payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
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
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  return membership.docs.length > 0 || String(req.user?.id) === String(targetUserID)
}

export async function getUserIDsInOrganizations(
  req: PayloadRequest,
  organizationIDs: Array<number | string>,
  statuses: OrganizationMembershipStatus[] = ['active', 'pending'],
) {
  if (organizationIDs.length === 0) {
    return []
  }

  const memberships = await req.payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 2000,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          organization: {
            in: organizationIDs,
          },
        },
        {
          status: {
            in: statuses,
          },
        },
      ],
    },
  })

  return uniqueIDs(
    memberships.docs
      .map((membership) => normalizeRelationshipID(membership.user))
      .filter((value): value is number | string => value !== null),
  )
}

export async function userHasActiveOrganizationMembership(
  req: PayloadRequest,
  userID: number | string,
  organizationID: number | string,
) {
  const memberships = await req.payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      and: [
        {
          organization: {
            equals: organizationID,
          },
        },
        {
          user: {
            equals: userID,
          },
        },
        {
          status: {
            equals: 'active',
          },
        },
      ],
    },
  })

  return memberships.docs.length > 0
}
