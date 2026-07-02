'use server'

import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPayload, type Payload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import { getManageableOrganizationIDs } from '@/lib/organizations'
import { revalidateOrganizationPaths } from '@/lib/revalidate-organization-paths'
import { canCreateEvents, isSuperAdminUser } from '@/lib/permissions'
import type { Event, User } from '@/payload-types'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function booleanValue(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on'
}

function statusValue(formData: FormData): 'active' | 'archived' | 'draft' {
  const value = stringValue(formData, 'status')

  if (value === 'active' || value === 'archived' || value === 'draft') {
    return value
  }

  return 'active'
}

function dateValue(formData: FormData, key: string): string | undefined {
  const value = stringValue(formData, key)

  return value ? new Date(value).toISOString() : undefined
}

function relationshipID(value: number | string | { id?: number | string } | null | undefined) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  return value?.id
}

export async function canDeleteEvent(
  payload: Payload,
  user: User,
  event: Pick<Event, 'createdBy' | 'id' | 'organization'>,
) {
  if (isSuperAdminUser(user)) {
    return true
  }

  const organizationID = relationshipID(event.organization)

  if (organizationID) {
    const manageableOrganizationIDs = await getManageableOrganizationIDs({ payload, user } as never)

    if (manageableOrganizationIDs !== null && manageableOrganizationIDs.includes(organizationID)) {
      return true
    }
  }

  if (!(await canCreateEvents({ payload, user } as never))) {
    return false
  }

  if (relationshipID(event.createdBy) === user.id) {
    return true
  }

  const assignments = await payload.find({
    collection: 'event-assignments',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    user,
    where: {
      and: [
        {
          event: {
            equals: event.id,
          },
        },
        {
          user: {
            equals: user.id,
          },
        },
        {
          roleForEvent: {
            equals: 'admin',
          },
        },
      ],
    },
  })

  return assignments.docs.length > 0
}

function numericValue(formData: FormData, key: string): number | undefined {
  const value = stringValue(formData, key)
  const parsed = value ? Number(value) : NaN

  return Number.isFinite(parsed) ? parsed : undefined
}

async function assertCanCreateEventInOrganization(
  payload: Payload,
  user: User,
  organizationId: number,
) {
  if (!(await canCreateEvents({ payload, user } as never))) {
    throw new Error('You do not have permission to create events in an organization.')
  }

  if (isSuperAdminUser(user)) {
    return
  }

  const manageableOrganizationIDs = await getManageableOrganizationIDs({ payload, user } as never)

  if (manageableOrganizationIDs !== null && !manageableOrganizationIDs.includes(organizationId)) {
    throw new Error('You do not have permission to create events in this organization.')
  }
}

export async function createEventAction(formData: FormData) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const title = stringValue(formData, 'title')
  const organizationId = numericValue(formData, 'organizationId')

  if (!title) {
    throw new Error('Event title is required.')
  }

  if (!organizationId) {
    throw new Error('Organization is required.')
  }

  await assertCanCreateEventInOrganization(payload, user, organizationId)

  await payload.create({
    collection: 'events',
    data: {
      dateEnd: dateValue(formData, 'dateEnd'),
      dateStart: dateValue(formData, 'dateStart'),
      defaultLanguage: stringValue(formData, 'defaultLanguage') ?? 'en',
      description: stringValue(formData, 'description'),
      location: stringValue(formData, 'location'),
      listenerPassword: stringValue(formData, 'listenerPassword'),
      listenerPasswordEnabled: booleanValue(formData, 'listenerPasswordEnabled'),
      organization: organizationId,
      publicListenerEnabled: booleanValue(formData, 'publicListenerEnabled'),
      unifiedListenerQrEnabled: booleanValue(formData, 'unifiedListenerQrEnabled'),
      slug: slugify(stringValue(formData, 'slug') ?? title),
      speakerPassword: stringValue(formData, 'speakerPassword'),
      speakerPasswordEnabled: booleanValue(formData, 'speakerPasswordEnabled'),
      status: statusValue(formData),
      title,
    },
    overrideAccess: false,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath('/events')
  revalidateOrganizationPaths()

  const organization = await payload.findByID({
    id: organizationId,
    collection: 'organizations',
    depth: 0,
    overrideAccess: true,
  })
  revalidateOrganizationPaths(organization.slug)
  redirect(`/organizations/${organization.slug}?tab=events`)
}

export async function updateEventAction(formData: FormData) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const id = stringValue(formData, 'id')
  const originalSlug = stringValue(formData, 'originalSlug')
  const title = stringValue(formData, 'title')
  const organizationId = numericValue(formData, 'organizationId')

  if (!id || !originalSlug || !title) {
    throw new Error('Event ID, original slug, and title are required.')
  }

  if (!organizationId) {
    throw new Error('Organization is required.')
  }

  await assertCanCreateEventInOrganization(payload, user, organizationId)

  const event = await payload.update({
    id,
    collection: 'events',
    data: {
      dateEnd: dateValue(formData, 'dateEnd'),
      dateStart: dateValue(formData, 'dateStart'),
      defaultLanguage: stringValue(formData, 'defaultLanguage') ?? 'en',
      description: stringValue(formData, 'description'),
      location: stringValue(formData, 'location'),
      listenerPassword: stringValue(formData, 'listenerPassword'),
      listenerPasswordEnabled: booleanValue(formData, 'listenerPasswordEnabled'),
      organization: organizationId,
      publicListenerEnabled: booleanValue(formData, 'publicListenerEnabled'),
      unifiedListenerQrEnabled: booleanValue(formData, 'unifiedListenerQrEnabled'),
      slug: slugify(stringValue(formData, 'slug') ?? title),
      speakerPassword: stringValue(formData, 'speakerPassword'),
      speakerPasswordEnabled: booleanValue(formData, 'speakerPasswordEnabled'),
      status: statusValue(formData),
      title,
    },
    overrideAccess: false,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath('/events')
  revalidatePath(`/events/${originalSlug}`)
  revalidatePath(`/listen/${event.slug}`)
  revalidateOrganizationPaths()

  const organization = await payload.findByID({
    id: organizationId,
    collection: 'organizations',
    depth: 0,
    overrideAccess: true,
  })
  revalidateOrganizationPaths(organization.slug)
  redirect(`/events/${event.slug}?settings=open`)
}

export async function deleteEventAction(formData: FormData) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const id = stringValue(formData, 'id')

  if (!id) {
    throw new Error('Event ID is required.')
  }

  const event = await payload.findByID({
    id,
    collection: 'events',
    overrideAccess: true,
    user,
  })

  if (!(await canDeleteEvent(payload, user, event))) {
    throw new Error('You do not have permission to delete this event.')
  }

  const [channels, assignments] = await Promise.all([
    payload.find({
      collection: 'channels',
      depth: 0,
      limit: 1000,
      overrideAccess: true,
      pagination: false,
      user,
      where: {
        event: {
          equals: id,
        },
      },
    }),
    payload.find({
      collection: 'event-assignments',
      depth: 0,
      limit: 1000,
      overrideAccess: true,
      pagination: false,
      user,
      where: {
        event: {
          equals: id,
        },
      },
    }),
  ])

  for (const channel of channels.docs) {
    await payload.delete({
      id: channel.id,
      collection: 'channels',
      overrideAccess: true,
      user,
    })
  }

  for (const assignment of assignments.docs) {
    await payload.delete({
      id: assignment.id,
      collection: 'event-assignments',
      overrideAccess: true,
      user,
    })
  }

  await payload.delete({
    id,
    collection: 'events',
    overrideAccess: true,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath('/events')
  revalidatePath('/channels')

  if (stringValue(formData, 'returnTo') === 'list') {
    return
  }

  redirect('/events')
}

function numericValues(formData: FormData, key: string): number[] {
  return formData
    .getAll(key)
    .map((value) => (typeof value === 'string' ? Number(value) : NaN))
    .filter((value): value is number => Number.isFinite(value))
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)]
}

async function deleteEventRecord(
  payload: Payload,
  user: User,
  eventID: number,
) {
  const event = await payload.findByID({
    id: eventID,
    collection: 'events',
    overrideAccess: true,
    user,
  })

  if (!(await canDeleteEvent(payload, user, event))) {
    throw new Error(`You do not have permission to delete ${event.title}.`)
  }

  const [channels, assignments] = await Promise.all([
    payload.find({
      collection: 'channels',
      depth: 0,
      limit: 1000,
      overrideAccess: true,
      pagination: false,
      user,
      where: {
        event: {
          equals: eventID,
        },
      },
    }),
    payload.find({
      collection: 'event-assignments',
      depth: 0,
      limit: 1000,
      overrideAccess: true,
      pagination: false,
      user,
      where: {
        event: {
          equals: eventID,
        },
      },
    }),
  ])

  for (const channel of channels.docs) {
    await payload.delete({
      id: channel.id,
      collection: 'channels',
      overrideAccess: true,
      user,
    })
  }

  for (const assignment of assignments.docs) {
    await payload.delete({
      id: assignment.id,
      collection: 'event-assignments',
      overrideAccess: true,
      user,
    })
  }

  await payload.delete({
    id: eventID,
    collection: 'events',
    overrideAccess: true,
    user,
  })
}

export async function bulkEventsAction(formData: FormData) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const bulkAction = stringValue(formData, 'bulkAction')
  const returnPath = stringValue(formData, 'returnPath') ?? '/events'
  const eventIDs = uniqueNumbers(numericValues(formData, 'eventIDs'))
  const bulkStatus = stringValue(formData, 'bulkStatus')

  if (!bulkAction) {
    throw new Error('Choose a bulk action.')
  }

  if (eventIDs.length === 0) {
    throw new Error('Select at least one event.')
  }

  if (bulkAction === 'set-status') {
    if (bulkStatus !== 'active' && bulkStatus !== 'draft' && bulkStatus !== 'archived') {
      throw new Error('Choose a valid status.')
    }

    for (const eventID of eventIDs) {
      await payload.update({
        id: eventID,
        collection: 'events',
        data: {
          status: bulkStatus,
        },
        overrideAccess: false,
        user,
      })
    }
  } else if (bulkAction === 'delete') {
    for (const eventID of eventIDs) {
      await deleteEventRecord(payload, user, eventID)
    }
  } else {
    throw new Error('Unsupported bulk action.')
  }

  revalidatePath('/dashboard')
  revalidatePath('/events')
  revalidatePath('/channels')
  revalidateOrganizationPaths()
  redirect(returnPath)
}
