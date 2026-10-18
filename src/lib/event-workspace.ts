import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { canManageChannels } from '@/app/events/[eventSlug]/channels/actions'
import { canManageAssignment } from '@/app/events/[eventSlug]/settings/actions'
import { requireAppUser } from '@/lib/app-auth'
import { getDashboardEvent } from '@/lib/dashboard-data'
import { isSuperAdminUser } from '@/lib/permissions'
import type { OrganizationMembership, User } from '@/payload-types'

/**
 * Everything the event tabs (Channels, People, Share, Settings) share: the event, who is
 * looking, and what they may manage. A missing or forbidden event is a 404 for every tab.
 */
export async function loadEventWorkspace(eventSlug: string) {
  const event = await getDashboardEvent(eventSlug)

  if (!event) {
    notFound()
  }

  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const [eventRecord, canManageAssignments, canManageChannelsUser] = await Promise.all([
    payload.find({
      collection: 'events',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      user,
      where: { slug: { equals: eventSlug } },
    }),
    canManageAssignment(payload, user, event.id),
    canManageChannels(payload, user, event.id),
  ])
  const fullEvent = eventRecord.docs[0]

  if (!fullEvent) {
    notFound()
  }

  return { canManageAssignments, canManageChannelsUser, event, fullEvent, payload, user }
}

export type AssignableUser = {
  email: string
  id: number
  membershipStatus?: string | null
  name: string
  role?: string | null
}

function userFromMembership(membership: OrganizationMembership): User | null {
  return typeof membership.user === 'number' ? null : membership.user
}

/** Members of the event's organization who can be added to its team (moderators, or anyone for super admins). */
export async function getAssignableUsersForEvent(
  payload: Awaited<ReturnType<typeof getPayload>>,
  currentUser: User,
  organizationID?: null | number,
): Promise<AssignableUser[]> {
  if (!organizationID) {
    return []
  }

  const memberships = await payload.find({
    collection: 'organization-memberships',
    depth: 1,
    limit: 500,
    overrideAccess: false,
    pagination: false,
    sort: 'status',
    user: currentUser,
    where: {
      and: [{ organization: { equals: organizationID } }, { status: { in: ['active', 'pending'] } }],
    },
  })

  const canAssignAnyRole = isSuperAdminUser(currentUser)
  const usersByID = new Map<number, AssignableUser>()

  for (const membership of memberships.docs) {
    const member = userFromMembership(membership)

    if (!member) {
      continue
    }

    if (!canAssignAnyRole && member.role !== 'moderator') {
      continue
    }

    usersByID.set(member.id, {
      email: member.email,
      id: member.id,
      membershipStatus: membership.status,
      name: member.name,
      role: member.role,
    })
  }

  return [...usersByID.values()].sort((a, b) => a.name.localeCompare(b.name))
}
