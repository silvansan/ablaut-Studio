import type { Payload } from 'payload'

import { generateOrgKey } from '@/lib/org-key'
import { isOrganizationManagerRole } from '@/lib/organizations'

const DEFAULT_ORGANIZATION_SLUG = 'default'
const DEFAULT_ORGANIZATION_NAME = 'Default Organization'

function normalizeRelationshipID(value: number | string | { id?: number | string } | null | undefined) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return value.id ?? null
  }

  return null
}

/** Safety net: every organization needs a public key for its admin URLs (the migration backfills; this covers dev/push databases). */
export async function ensureOrganizationKeys(payload: Payload) {
  const missing = await payload.find({
    collection: 'organizations',
    depth: 0,
    limit: 500,
    overrideAccess: true,
    pagination: false,
    where: { publicKey: { exists: false } },
  })

  for (const organization of missing.docs) {
    await payload.update({
      collection: 'organizations',
      data: { publicKey: generateOrgKey() },
      id: organization.id,
      overrideAccess: true,
    })
  }

  if (missing.docs.length > 0) {
    payload.logger.info(`Assigned a public key to ${missing.docs.length} organization(s).`)
  }
}

export async function ensureDefaultOrganization(payload: Payload) {
  const existingOrganizations = await payload.count({
    collection: 'organizations',
    overrideAccess: true,
  })

  let organizationID: number | string | null = null

  if (existingOrganizations.totalDocs === 0) {
    const created = await payload.create({
      collection: 'organizations',
      data: {
        active: true,
        description: 'Bootstrap organization for existing deployments.',
        name: DEFAULT_ORGANIZATION_NAME,
        slug: DEFAULT_ORGANIZATION_SLUG,
      },
      overrideAccess: true,
    })

    organizationID = created.id
    payload.logger.info(`Created default organization "${DEFAULT_ORGANIZATION_NAME}".`)
  } else {
    const organizations = await payload.find({
      collection: 'organizations',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      sort: 'createdAt',
      where: {
        slug: {
          equals: DEFAULT_ORGANIZATION_SLUG,
        },
      },
    })

    organizationID = organizations.docs[0]?.id ?? null
  }

  if (!organizationID) {
    return
  }

  const eventsWithoutOrganization = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    where: {
      organization: {
        exists: false,
      },
    },
  })

  for (const event of eventsWithoutOrganization.docs) {
    await payload.update({
      collection: 'events',
      id: event.id,
      data: {
        organization: organizationID,
      },
      overrideAccess: true,
    })
  }

  const users = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
  })

  for (const user of users.docs) {
    const existingMembership = await payload.find({
      collection: 'organization-memberships',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [
          {
            organization: {
              equals: organizationID,
            },
          },
          {
            user: {
              equals: user.id,
            },
          },
        ],
      },
    })

    if (existingMembership.docs.length > 0) {
      continue
    }

    const roleInOrganization =
      user.role === 'super_admin' || user.role === 'admin'
        ? 'owner'
        : user.role === 'moderator'
          ? 'moderator'
          : 'viewer'

    await payload.create({
      collection: 'organization-memberships',
      data: {
        approvedAt: new Date().toISOString(),
        organization: organizationID,
        roleInOrganization,
        status: 'active',
        user: user.id,
      },
      overrideAccess: true,
    })
  }

  const assignments = await payload.find({
    collection: 'event-assignments',
    depth: 0,
    limit: 2000,
    overrideAccess: true,
    pagination: false,
  })

  for (const assignment of assignments.docs) {
    const userID = normalizeRelationshipID(assignment.user)

    if (!userID) {
      continue
    }

    const membership = await payload.find({
      collection: 'organization-memberships',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
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
        ],
      },
    })

    if (membership.docs.length > 0) {
      continue
    }

    await payload.create({
      collection: 'organization-memberships',
      data: {
        approvedAt: new Date().toISOString(),
        organization: organizationID,
        roleInOrganization: assignment.roleForEvent === 'admin' ? 'manager' : 'moderator',
        status: 'active',
        user: typeof userID === 'string' ? Number(userID) : userID,
      },
      overrideAccess: true,
    })
  }

  payload.logger.info('Default organization bootstrap completed.')
}

export function organizationRoleCanInvite(role: string | null | undefined): boolean {
  return isOrganizationManagerRole(role)
}
