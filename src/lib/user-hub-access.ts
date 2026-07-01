import type { PayloadRequest } from 'payload'

import {
  getManageableOrganizationIDs,
  getUserIDsInOrganizations,
  hasOrganizationManagementAccess,
  hasPlatformWideOrganizationAccess,
} from '@/lib/organizations'
import { isSuperAdminUser } from '@/lib/permissions'
import type { User } from '@/payload-types'

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

export async function getGloballyUnassignedUserIDs(req: PayloadRequest): Promise<number[]> {
  const memberships = await req.payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      status: {
        in: ['active', 'pending'],
      },
    },
  })

  const assignedUserIDs = uniqueIDs(
    memberships.docs
      .map((membership) => normalizeRelationshipID(membership.user))
      .filter((value): value is number | string => value !== null),
  )

  const candidates = await req.payload.find({
    collection: 'users',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    pagination: false,
    req,
    sort: 'name',
    where: {
      and: [
        {
          role: {
            equals: 'moderator',
          },
        },
        ...(assignedUserIDs.length > 0
          ? [
              {
                id: {
                  not_in: assignedUserIDs,
                },
              },
            ]
          : []),
      ],
    },
  })

  return candidates.docs.map((user) => user.id)
}

export async function canViewUserInUsersHub(
  req: PayloadRequest,
  targetUserID: number | string,
): Promise<boolean> {
  if (!req.user) {
    return false
  }

  if (String(req.user.id) === String(targetUserID)) {
    return true
  }

  if (!(await hasOrganizationManagementAccess(req))) {
    return false
  }

  const targetUser = await req.payload.findByID({
    collection: 'users',
    id: targetUserID,
    overrideAccess: true,
    req,
  })

  if (targetUser.role === 'super_admin' && !isSuperAdminUser(req.user)) {
    return false
  }

  if (hasPlatformWideOrganizationAccess(req.user as User)) {
    return true
  }

  const organizationIDs = await getManageableOrganizationIDs(req)

  if (!organizationIDs || organizationIDs.length === 0) {
    return false
  }

  const memberUserIDs = await getUserIDsInOrganizations(req, organizationIDs, ['active', 'pending'])

  if (memberUserIDs.some((userID) => String(userID) === String(targetUserID))) {
    return true
  }

  const unassignedUserIDs = await getGloballyUnassignedUserIDs(req)

  return unassignedUserIDs.some((userID) => String(userID) === String(targetUserID))
}
