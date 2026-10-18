import configPromise from '@payload-config'
import { cookies, headers } from 'next/headers'
import { cache } from 'react'
import { getPayload } from 'payload'

import { getCurrentAppUser } from '@/lib/app-auth'
import { ORG_COOKIE, ORG_KEY_HEADER, SCOPE_HEADER, URL_HEADER } from '@/lib/org-headers'
import { isOrgKey } from '@/lib/org-key'
import { getActiveMembershipsForUser, hasPlatformWideOrganizationAccess } from '@/lib/organizations'
import type { Organization, User } from '@/payload-types'

export type RequestScope = { kind: 'none' } | { kind: 'org'; orgKey: string } | { kind: 'platform' }

/** What the middleware decided about this request's URL. `none` for non-admin or legacy URLs. */
export async function getRequestScope(): Promise<RequestScope> {
  try {
    const requestHeaders = await headers()
    const scope = requestHeaders.get(SCOPE_HEADER)
    const orgKey = requestHeaders.get(ORG_KEY_HEADER)

    if (scope === 'org' && isOrgKey(orgKey)) {
      return { kind: 'org', orgKey }
    }

    if (scope === 'platform') {
      return { kind: 'platform' }
    }
  } catch {
    // Outside a request (build, scripts): no scope.
  }

  return { kind: 'none' }
}

/** Path plus query exactly as the browser requested it (before middleware rewrote it). */
export async function getRequestUrl(): Promise<null | string> {
  try {
    return (await headers()).get(URL_HEADER)
  } catch {
    return null
  }
}

function relationID(value: number | string | { id?: number | string } | null | undefined) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return value?.id ?? null
}

const loadAccessibleOrganizations = cache(
  async (userID: number | string, platformWide: boolean): Promise<Organization[]> => {
    const payload = await getPayload({ config: configPromise })

    if (platformWide) {
      const all = await payload.find({
        collection: 'organizations',
        depth: 0,
        limit: 500,
        overrideAccess: true,
        pagination: false,
        sort: 'name',
      })

      return all.docs.filter((organization) => organization.active !== false)
    }

    const memberships = await getActiveMembershipsForUser(
      { payload, user: { id: userID } } as never,
      userID,
    )
    const organizationIDs = [
      ...new Set(
        memberships
          .map((membership) => relationID(membership.organization))
          .filter((value): value is number | string => value !== null),
      ),
    ]

    if (organizationIDs.length === 0) {
      return []
    }

    const owned = await payload.find({
      collection: 'organizations',
      depth: 0,
      limit: 500,
      overrideAccess: true,
      pagination: false,
      sort: 'name',
      where: { id: { in: organizationIDs } },
    })

    return owned.docs.filter((organization) => organization.active !== false)
  },
)

/** Organizations the user may work inside: all of them for platform operators, memberships otherwise. */
export async function getAccessibleOrganizations(user: Pick<User, 'id' | 'role'>): Promise<Organization[]> {
  return loadAccessibleOrganizations(user.id, hasPlatformWideOrganizationAccess(user as User))
}

/** The organization named by the URL, or null when there is none or the visitor has no access to it. */
export const getCurrentOrganization = cache(async (): Promise<null | Organization> => {
  const scope = await getRequestScope()

  if (scope.kind !== 'org') {
    return null
  }

  const user = await getCurrentAppUser()

  if (!user) {
    return null
  }

  const organizations = await getAccessibleOrganizations(user)

  return organizations.find((organization) => organization.publicKey === scope.orgKey) ?? null
})

export async function getScopedOrganizationId(): Promise<null | number> {
  return (await getCurrentOrganization())?.id ?? null
}

/**
 * The organization the sidebar presents: the one in the URL, else the last one visited, else the
 * first available. Keeps the sidebar steady on Platform pages, which have no organization in the URL.
 */
export async function getSidebarOrganization(user: Pick<User, 'id' | 'role'>): Promise<null | Organization> {
  const current = await getCurrentOrganization()

  if (current) {
    return current
  }

  const organizations = await getAccessibleOrganizations(user)

  try {
    const remembered = (await cookies()).get(ORG_COOKIE)?.value
    const match = organizations.find((organization) => organization.publicKey === remembered)

    if (match) {
      return match
    }
  } catch {
    // cookies() unavailable: fall through.
  }

  return organizations[0] ?? null
}

/**
 * Where an old, unscoped URL (`/events/x`, a bookmark, a server-action redirect) should land.
 * Prefers the organization that owns the event in the URL, then the last one visited, then the first.
 */
export async function resolveCanonicalOrganization(
  user: Pick<User, 'id' | 'role'>,
  internalPath: string,
): Promise<null | Organization> {
  const organizations = await getAccessibleOrganizations(user)

  if (organizations.length === 0) {
    return null
  }

  const eventMatch = /^\/events\/([^/?#]+)/.exec(internalPath)

  if (eventMatch && eventMatch[1] !== 'new') {
    const payload = await getPayload({ config: configPromise })
    const events = await payload.find({
      collection: 'events',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: { slug: { equals: decodeURIComponent(eventMatch[1]) } },
    })
    const ownerID = relationID(events.docs[0]?.organization as never)
    const owner = organizations.find((organization) => organization.id === ownerID)

    if (owner) {
      return owner
    }
  }

  try {
    const remembered = (await cookies()).get(ORG_COOKIE)?.value
    const match = organizations.find((organization) => organization.publicKey === remembered)

    if (match) {
      return match
    }
  } catch {
    // cookies() unavailable: fall through to the first organization.
  }

  return organizations[0] ?? null
}
