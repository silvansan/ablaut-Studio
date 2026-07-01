'use server'

import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getPayload, type Payload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import { resolveChannelSlugForCreate, resolveChannelSlugForUpdate } from '@/lib/channel-identity'
import { canUserManageChannelsForEventByID } from '@/lib/permissions'
import type { User } from '@/payload-types'

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function booleanValue(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on'
}

function audioQualityValue(formData: FormData) {
  return {
    autoGainControl: booleanValue(formData, 'audioQuality.autoGainControl'),
    echoCancellation: booleanValue(formData, 'audioQuality.echoCancellation'),
    noiseSuppression: booleanValue(formData, 'audioQuality.noiseSuppression'),
  }
}

function tokenModeValue(formData: FormData): 'password' | 'private' | 'public' {
  const value = stringValue(formData, 'listenerTokenMode')

  return value === 'password' || value === 'private' ? value : 'public'
}

export async function canManageChannels(payload: Payload, user: User, eventID: number | string) {
  return canUserManageChannelsForEventByID({ payload, user } as never, eventID)
}

async function getEventID(eventSlug: string) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const events = await payload.find({
    collection: 'events',
    depth: 0,
    limit: 1,
    overrideAccess: false,
    pagination: false,
    user,
    where: {
      slug: {
        equals: eventSlug,
      },
    },
  })

  return { eventID: events.docs[0]?.id, payload, user }
}

export async function createChannelAction(formData: FormData) {
  const eventSlug = stringValue(formData, 'eventSlug')
  const name = stringValue(formData, 'name')

  if (!eventSlug || !name) {
    throw new Error('Event slug and channel name are required.')
  }

  const { eventID, payload, user } = await getEventID(eventSlug)

  if (!eventID) {
    throw new Error('Event not found.')
  }

  if (!(await canManageChannels(payload, user, eventID))) {
    throw new Error('You do not have permission to create channels for this event.')
  }

  const channel = await payload.create({
    collection: 'channels',
    data: {
      audioQuality: audioQualityValue(formData),
      description: stringValue(formData, 'description'),
      enabled: booleanValue(formData, 'enabled'),
      event: eventID,
      hlsEnabled: booleanValue(formData, 'hlsEnabled'),
      icecastFallbackUrl: stringValue(formData, 'icecastFallbackUrl'),
      listenerPageEnabled: booleanValue(formData, 'listenerPageEnabled'),
      listenerTokenMode: tokenModeValue(formData),
      slug: resolveChannelSlugForCreate(name),
      speakerPageEnabled: booleanValue(formData, 'speakerPageEnabled'),
      speakerPassword: stringValue(formData, 'speakerPassword'),
      speakerPasswordEnabled: booleanValue(formData, 'speakerPasswordEnabled'),
      sortOrder: Number(stringValue(formData, 'sortOrder') ?? 0),
      webrtcEnabled: booleanValue(formData, 'webrtcEnabled'),
      name,
    },
    overrideAccess: true,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath(`/events/${eventSlug}`)
  revalidatePath(`/events/${eventSlug}/channels`)
  revalidatePath(`/events/${eventSlug}/channels/${channel.slug}`)
  redirect(`/events/${eventSlug}/channels/${channel.slug}`)
}

export async function updateChannelAction(formData: FormData) {
  const eventSlug = stringValue(formData, 'eventSlug')
  const id = stringValue(formData, 'id')
  const originalSlug = stringValue(formData, 'originalSlug')
  const name = stringValue(formData, 'name')

  if (!eventSlug || !id || !originalSlug || !name) {
    throw new Error('Event slug, channel ID, original slug, and name are required.')
  }

  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const existingChannel = await payload.findByID({
    collection: 'channels',
    id,
    overrideAccess: true,
    user,
  })
  const eventID = typeof existingChannel.event === 'object' ? existingChannel.event.id : existingChannel.event

  if (!(await canManageChannels(payload, user, eventID))) {
    throw new Error('You do not have permission to update this channel.')
  }

  const channel = await payload.update({
    id,
    collection: 'channels',
    data: {
      audioQuality: audioQualityValue(formData),
      description: stringValue(formData, 'description'),
      enabled: booleanValue(formData, 'enabled'),
      hlsEnabled: booleanValue(formData, 'hlsEnabled'),
      icecastFallbackUrl: stringValue(formData, 'icecastFallbackUrl'),
      listenerPageEnabled: booleanValue(formData, 'listenerPageEnabled'),
      listenerTokenMode: tokenModeValue(formData),
      slug: resolveChannelSlugForUpdate(stringValue(formData, 'slug'), existingChannel.slug),
      speakerPageEnabled: booleanValue(formData, 'speakerPageEnabled'),
      speakerPassword: stringValue(formData, 'speakerPassword'),
      speakerPasswordEnabled: booleanValue(formData, 'speakerPasswordEnabled'),
      sortOrder: Number(stringValue(formData, 'sortOrder') ?? 0),
      webrtcEnabled: booleanValue(formData, 'webrtcEnabled'),
      name,
    },
    overrideAccess: true,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath(`/events/${eventSlug}`)
  revalidatePath(`/events/${eventSlug}/channels`)
  revalidatePath(`/events/${eventSlug}/channels/${originalSlug}`)
  revalidatePath(`/events/${eventSlug}/channels/${channel.slug}`)
  redirect(`/events/${eventSlug}/channels/${channel.slug}`)
}

export async function updateChannelSummaryAction(formData: FormData) {
  const eventSlug = stringValue(formData, 'eventSlug')
  const channelSlug = stringValue(formData, 'channelSlug')
  const id = stringValue(formData, 'id')
  const name = stringValue(formData, 'name')
  const description = formData.get('description')

  if (!eventSlug || !channelSlug || !id) {
    throw new Error('Event slug, channel slug, and channel ID are required.')
  }

  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const existingChannel = await payload.findByID({
    collection: 'channels',
    id,
    overrideAccess: true,
    user,
  })
  const eventID = typeof existingChannel.event === 'object' ? existingChannel.event.id : existingChannel.event

  if (!(await canManageChannels(payload, user, eventID))) {
    throw new Error('You do not have permission to update this channel.')
  }

  const data: { description?: string | null; name?: string } = {}

  if (name) {
    data.name = name
  }

  if (typeof description === 'string') {
    data.description = description.trim() || null
  }

  if (!data.name && !('description' in data)) {
    throw new Error('Nothing changed.')
  }

  await payload.update({
    id,
    collection: 'channels',
    data,
    overrideAccess: true,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath('/channels')
  revalidatePath(`/events/${eventSlug}`)
  revalidatePath(`/events/${eventSlug}/channels/${channelSlug}`)
}

export async function deleteChannelAction(formData: FormData) {
  const eventSlug = stringValue(formData, 'eventSlug')
  const id = stringValue(formData, 'id')

  if (!eventSlug || !id) {
    throw new Error('Event slug and channel ID are required.')
  }

  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const existingChannel = await payload.findByID({
    collection: 'channels',
    id,
    overrideAccess: true,
    user,
  })
  const eventID = typeof existingChannel.event === 'object' ? existingChannel.event.id : existingChannel.event

  if (!(await canManageChannels(payload, user, eventID))) {
    throw new Error('You do not have permission to delete this channel.')
  }

  await payload.delete({
    id,
    collection: 'channels',
    overrideAccess: true,
    user,
  })

  revalidatePath('/dashboard')
  revalidatePath('/events')
  revalidatePath('/channels')
  revalidatePath(`/events/${eventSlug}`)
  revalidatePath(`/events/${eventSlug}/channels`)

  if (stringValue(formData, 'returnTo') === 'list') {
    return
  }

  redirect(`/events/${eventSlug}/channels`)
}
