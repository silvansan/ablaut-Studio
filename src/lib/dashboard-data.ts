import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import type { Channel, Event } from '@/payload-types'

export type DashboardChannel = Pick<
  Channel,
  | 'description'
  | 'enabled'
  | 'hlsEnabled'
  | 'id'
  | 'icecastFallbackUrl'
  | 'languageCode'
  | 'languageLabel'
  | 'listenerPageEnabled'
  | 'livekitRoomName'
  | 'name'
  | 'roomName'
  | 'slug'
  | 'speakerPageEnabled'
  | 'sortOrder'
  | 'updatedAt'
  | 'webrtcEnabled'
>

export type DashboardEvent = Pick<
  Event,
  | 'createdBy'
  | 'dateEnd'
  | 'dateStart'
  | 'defaultLanguage'
  | 'description'
  | 'id'
  | 'location'
  | 'organization'
  | 'publicListenerEnabled'
  | 'slug'
  | 'status'
  | 'title'
  | 'updatedAt'
> & {
  channelCount: number
  organizationId?: number | null
  organizationTitle?: string | null
}

export type DashboardSummary = {
  activeEvents: number
  archivedEvents: number
  draftEvents: number
  recentChannels: (DashboardChannel & { eventSlug: string; eventTitle: string })[]
  recentEvents: DashboardEvent[]
  totalChannels: number
}

function normalizeEvent(event: Event, channelCount = 0): DashboardEvent {
  const organization = typeof event.organization === 'object' ? event.organization : null

  return {
    channelCount,
    createdBy: event.createdBy,
    dateEnd: event.dateEnd,
    dateStart: event.dateStart,
    defaultLanguage: event.defaultLanguage,
    description: event.description,
    id: event.id,
    location: event.location,
    organization: event.organization,
    organizationId: organization?.id ?? (typeof event.organization === 'number' ? event.organization : null),
    organizationTitle: organization?.name ?? null,
    publicListenerEnabled: event.publicListenerEnabled,
    slug: event.slug,
    status: event.status,
    title: event.title,
    updatedAt: event.updatedAt,
  }
}

function normalizeChannel(channel: Channel): DashboardChannel {
  return {
    description: channel.description,
    enabled: channel.enabled,
    hlsEnabled: channel.hlsEnabled,
    id: channel.id,
    icecastFallbackUrl: channel.icecastFallbackUrl,
    languageCode: channel.languageCode,
    languageLabel: channel.languageLabel,
    listenerPageEnabled: channel.listenerPageEnabled,
    livekitRoomName: channel.livekitRoomName,
    name: channel.name,
    roomName: channel.roomName,
    slug: channel.slug,
    speakerPageEnabled: channel.speakerPageEnabled,
    sortOrder: channel.sortOrder,
    updatedAt: channel.updatedAt,
    webrtcEnabled: channel.webrtcEnabled,
  }
}

function isAccessDenied(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as { status?: unknown }).status === 403
  )
}

async function getChannelCount(eventID: number, user: Awaited<ReturnType<typeof requireAppUser>>): Promise<number> {
  const payload = await getPayload({ config: configPromise })
  try {
    const channels = await payload.count({
      collection: 'channels',
      overrideAccess: false,
      user,
      where: {
        event: {
          equals: eventID,
        },
      },
    })

    return channels.totalDocs
  } catch (error) {
    if (isAccessDenied(error)) {
      return 0
    }

    throw error
  }
}

export async function getDashboardEvents(limit = 100): Promise<DashboardEvent[]> {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  let events: { docs: Event[] }

  try {
    events = await payload.find({
      collection: 'events',
      depth: 1,
      limit,
      overrideAccess: false,
      pagination: false,
      sort: '-updatedAt',
      user,
    })
  } catch (error) {
    if (isAccessDenied(error)) {
      return []
    }

    throw error
  }

  return Promise.all(events.docs.map(async (event) => normalizeEvent(event, await getChannelCount(event.id, user))))
}

export async function getDashboardEventsForOrganization(
  organizationId: number,
  limit = 100,
): Promise<DashboardEvent[]> {
  const events = await getDashboardEvents(limit)

  return events.filter((event) => event.organizationId === organizationId)
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const events = await getDashboardEvents(6)
  const channels = await payload
    .find({
      collection: 'channels',
      depth: 1,
      limit: 5,
      overrideAccess: false,
      pagination: false,
      sort: '-updatedAt',
      user,
    })
    .catch((error: unknown) => {
      if (isAccessDenied(error)) {
        return { docs: [], totalDocs: 0 }
      }

      throw error
    })

  const allEvents = await getDashboardEvents(1000)

  return {
    activeEvents: allEvents.filter((event) => event.status === 'active').length,
    archivedEvents: allEvents.filter((event) => event.status === 'archived').length,
    draftEvents: allEvents.filter((event) => event.status === 'draft').length,
    recentChannels: channels.docs.map((channel) => {
      const event = typeof channel.event === 'object' ? channel.event : null

      return {
        ...normalizeChannel(channel),
        eventSlug: event?.slug ?? String(channel.event),
        eventTitle: event?.title ?? String(channel.event),
      }
    }),
    recentEvents: events,
    totalChannels: channels.totalDocs,
  }
}

export async function getDashboardAllChannels(
  limit = 100,
): Promise<
  (DashboardChannel & {
    eventID: number
    eventSlug: string
    eventTitle: string
    organizationTitle?: string | null
  })[]
> {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const channels = await payload
    .find({
      collection: 'channels',
      depth: 2,
      limit,
      overrideAccess: false,
      pagination: false,
      sort: '-updatedAt',
      user,
    })
    .catch((error: unknown) => {
      if (isAccessDenied(error)) {
        return { docs: [] }
      }

      throw error
    })

  return channels.docs.map((channel) => {
    const event = typeof channel.event === 'object' ? channel.event : null
    const eventID = event?.id ?? (typeof channel.event === 'number' ? channel.event : 0)
    const organization = event && typeof event.organization === 'object' ? event.organization : null

    return {
      ...normalizeChannel(channel),
      eventID,
      eventSlug: event?.slug ?? String(channel.event),
      eventTitle: event?.title ?? String(channel.event),
      organizationTitle: organization?.name ?? null,
    }
  })
}

export async function getDashboardEvent(eventSlug: string): Promise<DashboardEvent | null> {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  let events: { docs: Event[] }

  try {
    events = await payload.find({
      collection: 'events',
      depth: 1,
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
  } catch (error) {
    if (isAccessDenied(error)) {
      return null
    }

    throw error
  }
  const event = events.docs[0]

  if (!event) {
    return null
  }

  return normalizeEvent(event, await getChannelCount(event.id, user))
}

export async function getDashboardChannels(eventSlug: string): Promise<DashboardChannel[]> {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  let events: { docs: Event[] }

  try {
    events = await payload.find({
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
  } catch (error) {
    if (isAccessDenied(error)) {
      return []
    }

    throw error
  }
  const event = events.docs[0]

  if (!event) {
    return []
  }

  let channels: { docs: Channel[] }

  try {
    channels = await payload.find({
      collection: 'channels',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      sort: 'sortOrder',
      user,
      where: {
        event: {
          equals: event.id,
        },
      },
    })
  } catch (error) {
    if (isAccessDenied(error)) {
      return []
    }

    throw error
  }

  return channels.docs.map(normalizeChannel)
}

export async function getDashboardChannel(
  eventSlug: string,
  channelSlug: string,
): Promise<(DashboardChannel & { event: DashboardEvent }) | null> {
  const event = await getDashboardEvent(eventSlug)

  if (!event) {
    return null
  }

  const channels = await getDashboardChannels(eventSlug)
  const channel = channels.find((candidate) => candidate.slug === channelSlug)

  if (!channel) {
    return null
  }

  return {
    ...channel,
    event,
  }
}
