'use server'

import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPayload, type Payload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import { canUserManageEventByID, isSuperAdminUser } from '@/lib/permissions'
import type { User } from '@/payload-types'

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
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

function relationshipID(value: number | string | { id?: number | string } | null | undefined) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return value?.id
}

export async function canManageAssignment(payload: Payload, user: User, eventID: number | string) {
  return canUserManageEventByID({ payload, user } as never, eventID)
}

export async function upsertEventAssignmentAction(formData: FormData) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const eventID = stringValue(formData, 'eventID')
  const eventSlug = stringValue(formData, 'eventSlug')
  const targetUserID = stringValue(formData, 'userID')
  const roleForEvent = eventRoleValue(formData)

  if (!eventID || !eventSlug || !targetUserID) {
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

  revalidatePath(`/events/${eventSlug}`)
  revalidatePath('/users')
  redirect(`/events/${eventSlug}?settings=open`)
}

export async function deleteEventAssignmentAction(formData: FormData) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const assignmentID = stringValue(formData, 'assignmentID')
  const eventSlug = stringValue(formData, 'eventSlug')

  if (!assignmentID || !eventSlug) {
    throw new Error('Assignment and event are required.')
  }

  const assignment = await payload.findByID({
    id: assignmentID,
    collection: 'event-assignments',
    overrideAccess: true,
    user,
  })
  const eventID = relationshipID(assignment.event)

  if (!eventID || !(await canManageAssignment(payload, user, eventID))) {
    throw new Error('You do not have permission to remove this event assignment.')
  }

  await payload.delete({
    id: assignmentID,
    collection: 'event-assignments',
    overrideAccess: true,
    user,
  })

  revalidatePath(`/events/${eventSlug}`)
  revalidatePath('/users')
  redirect(`/events/${eventSlug}?settings=open`)
}
