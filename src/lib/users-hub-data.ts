import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import { getManageableOrganizations } from '@/lib/organization-data'
import { hasOrganizationManagementAccess, hasPlatformWideOrganizationAccess } from '@/lib/organizations'
import { getGloballyUnassignedUserIDs } from '@/lib/user-hub-access'
import type { Organization, OrganizationMembership, User } from '@/payload-types'

export type UserHubEntry = {
  active: boolean
  globalRole: string
  invitationStatus: string | null
  membershipId: number | null
  organizationId: number | null
  organizationName: string | null
  organizationSlug: string | null
  roleInOrganization: string | null
  userEmail: string
  userId: number
  userName: string
}

export type UsersHubData = {
  entries: UserHubEntry[]
  organizations: Organization[]
  showOrganizationColumn: boolean
}

function organizationFromMembership(membership: OrganizationMembership): {
  id: number
  name: string
  slug: string
} | null {
  const organization = membership.organization

  if (typeof organization === 'number') {
    return null
  }

  if (!organization) {
    return null
  }

  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
  }
}

function buildEntryFromMembership(membership: OrganizationMembership, user: User): UserHubEntry | null {
  const organization = organizationFromMembership(membership)

  if (!organization) {
    return null
  }

  return {
    active: user.active !== false,
    globalRole: user.role ?? 'moderator',
    invitationStatus: user.invitationStatus ?? null,
    membershipId: membership.id,
    organizationId: organization.id,
    organizationName: organization.name,
    organizationSlug: organization.slug,
    roleInOrganization: membership.roleInOrganization ?? 'moderator',
    userEmail: user.email,
    userId: user.id,
    userName: user.name,
  }
}

export async function getUsersHubData(): Promise<UsersHubData> {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const organizations = await getManageableOrganizations()
  const organizationIDs = organizations.map((organization) => organization.id)
  const showOrganizationColumn = hasPlatformWideOrganizationAccess(currentUser) || organizations.length > 1

  if (organizationIDs.length === 0) {
    return {
      entries: [],
      organizations,
      showOrganizationColumn,
    }
  }

  const memberships = await payload.find({
    collection: 'organization-memberships',
    depth: 1,
    limit: 2000,
    overrideAccess: false,
    pagination: false,
    user: currentUser,
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

  const entries: UserHubEntry[] = []

  for (const membership of memberships.docs) {
    const memberUser = membership.user

    if (typeof memberUser === 'number') {
      continue
    }

    const entry = buildEntryFromMembership(membership, memberUser)

    if (entry) {
      entries.push(entry)
    }
  }

  if (await hasOrganizationManagementAccess({ payload, user: currentUser } as never)) {
    const memberUserIDs = new Set(entries.map((entry) => entry.userId))

    if (hasPlatformWideOrganizationAccess(currentUser)) {
      const unassignedUsers = await payload.find({
        collection: 'users',
        depth: 0,
        limit: 500,
        overrideAccess: false,
        pagination: false,
        sort: 'name',
        user: currentUser,
      })

      for (const user of unassignedUsers.docs) {
        if (memberUserIDs.has(user.id)) {
          continue
        }

        entries.push({
          active: user.active !== false,
          globalRole: user.role ?? 'moderator',
          invitationStatus: user.invitationStatus ?? null,
          membershipId: null,
          organizationId: null,
          organizationName: null,
          organizationSlug: null,
          roleInOrganization: null,
          userEmail: user.email,
          userId: user.id,
          userName: user.name,
        })
      }
    } else {
      const unassignedUserIDs = await getGloballyUnassignedUserIDs({ payload, user: currentUser } as never)

      for (const userID of unassignedUserIDs) {
        if (memberUserIDs.has(userID)) {
          continue
        }

        const user = await payload.findByID({
          collection: 'users',
          id: userID,
          overrideAccess: true,
        })

        entries.push({
          active: user.active !== false,
          globalRole: user.role ?? 'moderator',
          invitationStatus: user.invitationStatus ?? null,
          membershipId: null,
          organizationId: null,
          organizationName: null,
          organizationSlug: null,
          roleInOrganization: null,
          userEmail: user.email,
          userId: user.id,
          userName: user.name,
        })
      }
    }
  }

  entries.sort((a, b) => {
    const organizationCompare = (a.organizationName ?? '').localeCompare(b.organizationName ?? '')

    if (organizationCompare !== 0) {
      return organizationCompare
    }

    return a.userName.localeCompare(b.userName)
  })

  return {
    entries,
    organizations,
    showOrganizationColumn,
  }
}

export async function getPendingJoinRequestsForHub() {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  if (!(await hasOrganizationManagementAccess({ payload, user: currentUser } as never))) {
    return []
  }

  const organizations = await getManageableOrganizations()
  const organizationIDs = organizations.map((organization) => organization.id)

  if (organizationIDs.length === 0) {
    return []
  }

  const memberships = await payload.find({
    collection: 'organization-memberships',
    depth: 1,
    limit: 200,
    overrideAccess: false,
    pagination: false,
    sort: 'updatedAt',
    user: currentUser,
    where: {
      and: [
        {
          organization: {
            in: organizationIDs,
          },
        },
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
      ],
    },
  })

  return memberships.docs
}
