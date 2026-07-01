import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import { getDashboardEventsForOrganization } from '@/lib/dashboard-data'
import { getManageableOrganizations } from '@/lib/organization-data'
import { eventTitle, userID } from '@/lib/organization-user-utils'
import { getManageableOrganizationIDs } from '@/lib/organizations'
import { canViewUserInUsersHub } from '@/lib/user-hub-access'
import type { EventAssignment, OrganizationMembership, User } from '@/payload-types'

export type UserDetailData = {
  assignments: EventAssignment[]
  manageableOrganizations: Awaited<ReturnType<typeof getManageableOrganizations>>
  memberships: OrganizationMembership[]
  targetUser: User
  userEvents: string[]
}

export async function getUserDetailData(targetUserID: number): Promise<UserDetailData | null> {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const req = { payload, user: currentUser } as never

  if (!(await canViewUserInUsersHub(req, targetUserID))) {
    return null
  }

  const targetUser = await payload.findByID({
    collection: 'users',
    id: targetUserID,
    overrideAccess: true,
  })

  const manageableOrganizations = await getManageableOrganizations()
  const manageableOrganizationIDs = await getManageableOrganizationIDs(req)

  const memberships =
    manageableOrganizationIDs && manageableOrganizationIDs.length > 0
      ? (
          await payload.find({
            collection: 'organization-memberships',
            depth: 1,
            limit: 100,
            overrideAccess: true,
            pagination: false,
            where: {
              and: [
                {
                  user: {
                    equals: targetUserID,
                  },
                },
                {
                  organization: {
                    in: manageableOrganizationIDs,
                  },
                },
              ],
            },
          })
        ).docs
      : manageableOrganizationIDs === null
        ? (
            await payload.find({
              collection: 'organization-memberships',
              depth: 1,
              limit: 100,
              overrideAccess: true,
              pagination: false,
              where: {
                user: {
                  equals: targetUserID,
                },
              },
            })
          ).docs
        : []

  const eventIDs = new Set<number>()

  for (const organization of manageableOrganizations) {
    const events = await getDashboardEventsForOrganization(organization.id, 500)

    for (const event of events) {
      eventIDs.add(event.id)
    }
  }

  const assignments =
    eventIDs.size > 0
      ? (
          await payload.find({
            collection: 'event-assignments',
            depth: 1,
            limit: 200,
            overrideAccess: false,
            pagination: false,
            user: currentUser,
            where: {
              and: [
                {
                  user: {
                    equals: targetUserID,
                  },
                },
                {
                  event: {
                    in: [...eventIDs],
                  },
                },
              ],
            },
          })
        ).docs
      : []

  const userEvents = assignments.map((assignment) => eventTitle(assignment.event))

  return {
    assignments,
    manageableOrganizations,
    memberships,
    targetUser,
    userEvents,
  }
}

export function membershipOrganizationID(membership: OrganizationMembership): number | null {
  const organization = membership.organization

  if (typeof organization === 'number') {
    return organization
  }

  return organization?.id ?? null
}

export function isSelfUser(currentUser: User, targetUser: User): boolean {
  return String(currentUser.id) === String(targetUser.id)
}

export { userID }
