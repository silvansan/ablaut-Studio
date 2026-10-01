import { randomBytes } from 'node:crypto'
import type { Payload } from 'payload'

import type { Channel, Event } from '@/payload-types'

// Digits 2-9 and A-Z minus I/L/O/U, so no character can be mistaken for 0/1.
const PUBLIC_ID_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ'
const PUBLIC_ID_LENGTH = 12

export function generatePublicId(): string {
  const bytes = randomBytes(PUBLIC_ID_LENGTH)
  let id = ''

  for (let i = 0; i < PUBLIC_ID_LENGTH; i += 1) {
    id += PUBLIC_ID_ALPHABET[bytes[i] % PUBLIC_ID_ALPHABET.length]
  }

  return id
}

export function effectiveEventSegment(event: Pick<Event, 'privateLinksEnabled' | 'publicId' | 'slug'>): string {
  return event.privateLinksEnabled === true && event.publicId ? event.publicId : event.slug
}

export function effectiveChannelSegment(
  event: Pick<Event, 'privateLinksEnabled'>,
  channel: Pick<Channel, 'publicId' | 'slug'>,
): string {
  return event.privateLinksEnabled === true && channel.publicId ? channel.publicId : channel.slug
}

/** Generates ids only for the event/channels that don't already have one. Called when "Private links" is turned on. */
export async function ensurePrivateLinkIds(payload: Payload, eventId: number | string): Promise<void> {
  const event = await payload.findByID({ collection: 'events', id: eventId, overrideAccess: true })

  if (!event.publicId) {
    await payload.update({
      collection: 'events',
      id: eventId,
      data: { publicId: generatePublicId() },
      overrideAccess: true,
    })
  }

  const channels = await payload.find({
    collection: 'channels',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    where: { event: { equals: eventId } },
  })

  // Sequential on purpose: concurrent updates to sibling channels under the same event
  // race on the Channels afterChange hook that syncs the parent event's channel list,
  // and some writes get silently lost.
  for (const channel of channels.docs) {
    if (!channel.publicId) {
      await payload.update({
        collection: 'channels',
        id: channel.id,
        data: { publicId: generatePublicId() },
        overrideAccess: true,
      })
    }
  }
}

/** Rotates the event's and every channel's id, invalidating every link and QR shared so far. */
export async function regeneratePrivateLinkIds(payload: Payload, eventId: number | string): Promise<void> {
  await payload.update({
    collection: 'events',
    id: eventId,
    data: { publicId: generatePublicId() },
    overrideAccess: true,
  })

  const channels = await payload.find({
    collection: 'channels',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    where: { event: { equals: eventId } },
  })

  // Sequential for the same reason as ensurePrivateLinkIds above.
  for (const channel of channels.docs) {
    await payload.update({
      collection: 'channels',
      id: channel.id,
      data: { publicId: generatePublicId() },
      overrideAccess: true,
    })
  }
}
