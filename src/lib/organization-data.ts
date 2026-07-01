import configPromise from '@payload-config'
import { getPayload, type Where } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import { getManageableOrganizationIDs } from '@/lib/organizations'
import type { Organization } from '@/payload-types'

export type OrganizationSummary = {
  eventCount: number
  id: number
  memberCount: number
  name: string
  slug: string
}

async function buildEventCountByOrganization(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<Map<number, number>> {
  const eventsInOrgs = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 2000,
    overrideAccess: true,
    pagination: false,
    where: {
      organization: {
        exists: true,
      },
    },
  })
  const eventCountByOrganization = new Map<number, number>()

  for (const event of eventsInOrgs.docs) {
    const organizationID = typeof event.organization === 'number' ? event.organization : event.organization?.id

    if (typeof organizationID === 'number') {
      eventCountByOrganization.set(organizationID, (eventCountByOrganization.get(organizationID) ?? 0) + 1)
    }
  }

  return eventCountByOrganization
}

async function buildMemberCountByOrganization(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<Map<number, number>> {
  const memberships = await payload.find({
    collection: 'organization-memberships',
    depth: 0,
    limit: 5000,
    overrideAccess: true,
    pagination: false,
    where: {
      status: {
        equals: 'active',
      },
    },
  })
  const memberCountByOrganization = new Map<number, number>()

  for (const membership of memberships.docs) {
    const organizationID =
      typeof membership.organization === 'number' ? membership.organization : membership.organization?.id

    if (typeof organizationID === 'number') {
      memberCountByOrganization.set(
        organizationID,
        (memberCountByOrganization.get(organizationID) ?? 0) + 1,
      )
    }
  }

  return memberCountByOrganization
}

function manageableOrganizationWhere(
  manageableOrganizationIDs: Array<number | string> | null,
): Where | undefined {
  if (manageableOrganizationIDs === null) {
    return undefined
  }

  if (manageableOrganizationIDs.length === 0) {
    return {
      id: {
        equals: -1,
      },
    }
  }

  return {
    id: {
      in: manageableOrganizationIDs,
    },
  }
}

export async function getManageableOrganizations(): Promise<Organization[]> {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const manageableOrganizationIDs = await getManageableOrganizationIDs({ payload, user: currentUser } as never)

  const organizations = await payload.find({
    collection: 'organizations',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    pagination: false,
    sort: 'name',
    user: currentUser,
    where: manageableOrganizationWhere(manageableOrganizationIDs),
  })

  return organizations.docs
}

export async function getOrganizationSummaries(): Promise<OrganizationSummary[]> {
  const payload = await getPayload({ config: configPromise })
  const organizations = await getManageableOrganizations()
  const [eventCountByOrganization, memberCountByOrganization] = await Promise.all([
    buildEventCountByOrganization(payload),
    buildMemberCountByOrganization(payload),
  ])

  return organizations.map((organization) => ({
    eventCount: eventCountByOrganization.get(organization.id) ?? 0,
    id: organization.id,
    memberCount: memberCountByOrganization.get(organization.id) ?? 0,
    name: organization.name,
    slug: organization.slug,
  }))
}

export async function getOrganizationBySlug(orgSlug: string): Promise<Organization | null> {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const manageableOrganizationIDs = await getManageableOrganizationIDs({ payload, user: currentUser } as never)

  const organizations = await payload.find({
    collection: 'organizations',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user: currentUser,
    where: {
      and: [
        {
          slug: {
            equals: orgSlug,
          },
        },
        ...(manageableOrganizationWhere(manageableOrganizationIDs)
          ? [manageableOrganizationWhere(manageableOrganizationIDs)!]
          : []),
      ],
    },
  })

  return organizations.docs[0] ?? null
}

export async function getOrganizationSummary(orgSlug: string): Promise<
  | (OrganizationSummary & {
      description?: string | null
      active?: boolean | null
    })
  | null
> {
  const organization = await getOrganizationBySlug(orgSlug)

  if (!organization) {
    return null
  }

  const payload = await getPayload({ config: configPromise })
  const [eventCountByOrganization, memberCountByOrganization] = await Promise.all([
    buildEventCountByOrganization(payload),
    buildMemberCountByOrganization(payload),
  ])

  return {
    active: organization.active,
    description: organization.description,
    eventCount: eventCountByOrganization.get(organization.id) ?? 0,
    id: organization.id,
    memberCount: memberCountByOrganization.get(organization.id) ?? 0,
    name: organization.name,
    slug: organization.slug,
  }
}
