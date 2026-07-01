import type { CollectionConfig, PayloadRequest } from 'payload'

import { canAssignModerators } from '@/access/canAssignModerators'
import { userHasActiveOrganizationMembership } from '@/lib/organizations'
import { canUserManageEventByID, getManageableEventIDs, getViewableEventIDs, isModeratorUser, isSuperAdminUser } from '@/lib/permissions'

type EventRole = 'admin' | 'moderator' | 'viewer'

function normalizeRelationshipID(value: number | string | { id?: number | string } | null | undefined) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return value.id ?? null
  }

  return null
}

function getDefaultPermissionsForRole(roleForEvent: EventRole) {
  if (roleForEvent === 'admin') {
    return {
      canEditEvent: true,
      canCreateChannels: true,
      canDeleteChannels: true,
      canViewQR: true,
      canManageSpeakerPassword: true,
    }
  }

  if (roleForEvent === 'moderator') {
    return {
      canEditEvent: false,
      canCreateChannels: true,
      canDeleteChannels: true,
      canViewQR: true,
      canManageSpeakerPassword: true,
    }
  }

  return {
    canEditEvent: false,
    canCreateChannels: false,
    canDeleteChannels: false,
    canViewQR: true,
    canManageSpeakerPassword: false,
  }
}

async function syncAssignedUsers(req: PayloadRequest, eventID: number | string | null | undefined) {
  const comparableEventID = normalizeRelationshipID(eventID)

  if (!comparableEventID) {
    return
  }

  const assignments = await req.payload.find({
    collection: 'event-assignments',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      event: {
        equals: comparableEventID,
      },
    },
  })

  const assignedAdmins = assignments.docs
    .filter((assignment) => assignment.roleForEvent === 'admin')
    .map((assignment) => normalizeRelationshipID(assignment.user))
    .filter((value): value is number => typeof value === 'number')

  const assignedModerators = assignments.docs
    .filter((assignment) => assignment.roleForEvent === 'moderator')
    .map((assignment) => normalizeRelationshipID(assignment.user))
    .filter((value): value is number => typeof value === 'number')

  await req.payload.update({
    collection: 'events',
    id: comparableEventID,
    data: {
      assignedAdmins,
      assignedModerators,
    },
    overrideAccess: true,
    req,
  })
}

export const EventAssignments: CollectionConfig = {
  slug: 'event-assignments',
  access: {
    create: canAssignModerators,
    delete: async ({ req }) => {
      if (isSuperAdminUser(req.user)) {
        return true
      }

      const eventIDs = await getManageableEventIDs(req)

      if (eventIDs === null) {
        return true
      }

      if (eventIDs.length === 0) {
        return false
      }

      return {
        event: {
          in: eventIDs,
        },
      }
    },
    read: async ({ req }) => {
      if (isSuperAdminUser(req.user)) {
        return true
      }

      if (!isModeratorUser(req.user)) {
        return false
      }

      const eventIDs = await getViewableEventIDs(req)

      if (eventIDs === null) {
        return true
      }

      if (eventIDs.length === 0) {
        return false
      }

      return {
        event: {
          in: eventIDs,
        },
      }
    },
    update: async ({ req }) => {
      if (isSuperAdminUser(req.user)) {
        return true
      }

      const eventIDs = await getManageableEventIDs(req)

      if (eventIDs === null) {
        return true
      }

      if (eventIDs.length === 0) {
        return false
      }

      return {
        event: {
          in: eventIDs,
        },
      }
    },
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'event', 'roleForEvent', 'updatedAt'],
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
    },
    {
      name: 'event',
      type: 'relationship',
      relationTo: 'events',
      required: true,
    },
    {
      name: 'roleForEvent',
      type: 'select',
      required: true,
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Moderator', value: 'moderator' },
        { label: 'Viewer', value: 'viewer' },
      ],
    },
    {
      name: 'permissions',
      type: 'group',
      fields: [
        {
          name: 'canEditEvent',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'canCreateChannels',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'canDeleteChannels',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'canViewQR',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'canManageSpeakerPassword',
          type: 'checkbox',
          defaultValue: false,
        },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        await syncAssignedUsers(req, doc.event)

        const previousEventID = normalizeRelationshipID(previousDoc?.event)
        const nextEventID = normalizeRelationshipID(doc.event)

        if (previousEventID && previousEventID !== nextEventID) {
          await syncAssignedUsers(req, previousEventID)
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await syncAssignedUsers(req, doc.event)
      },
    ],
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        const nextData = { ...data }
        const nextRole = (nextData.roleForEvent ?? originalDoc?.roleForEvent) as EventRole | undefined

        if (operation === 'create' && nextRole && !nextData.permissions) {
          nextData.permissions = getDefaultPermissionsForRole(nextRole)
        }

        if (
          operation === 'update' &&
          nextData.roleForEvent &&
          nextData.roleForEvent !== originalDoc?.roleForEvent &&
          nextData.permissions === undefined
        ) {
          nextData.permissions = getDefaultPermissionsForRole(nextData.roleForEvent as EventRole)
        }

        if (!isSuperAdminUser(req.user)) {
          const eventID = normalizeRelationshipID(nextData.event ?? originalDoc?.event)
          const assignedUserID = normalizeRelationshipID(nextData.user ?? originalDoc?.user)

          if (eventID && assignedUserID) {
            const event = await req.payload.findByID({
              collection: 'events',
              id: eventID,
              overrideAccess: true,
              req,
            })
            const organizationID = normalizeRelationshipID(event.organization)

            if (
              organizationID &&
              !(await userHasActiveOrganizationMembership(req, assignedUserID, organizationID))
            ) {
              throw new Error('Event assignments are limited to active members of the event organization.')
            }
          }
        }

        return nextData
      },
    ],
  },
}
