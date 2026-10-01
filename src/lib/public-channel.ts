import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getListenerAccessInfo } from '@/lib/listener-password'
import { resolvePublicLanguageFields } from '@/lib/channel-identity'
import { getBrowserLiveKitURL } from '@/lib/livekit'
import { getListenerUrl, getRequestBaseUrlFromRequest } from '@/lib/links'
import { effectiveChannelSegment, effectiveEventSegment } from '@/lib/private-links'
import { resolveChannelStreamInfo } from '@/lib/streaming/resolve-channel-stream'
import type { TransportKind, TransportStatus } from '@/lib/streaming/types'
import type { Channel, Event, SiteSetting } from '@/payload-types'

export type PublicChannelContext = {
  channel: Channel
  event: Event
  roomName: string
  settings: SiteSetting
  tokenExpiry: number
}

export type PublicChannelResponse = {
  access: {
    listenerPasswordConfigured: boolean
    listenerPasswordMissing: boolean
    listenerPasswordRequired: boolean
    listenerTokenMode: 'password' | 'private' | 'public'
    listenerUnavailable: boolean
    verifyPasswordEndpoint: string
  }
  channel: {
    description?: string | null
    enabled?: boolean | null
    hlsEnabled?: boolean | null
    hlsUrl?: string | null
    icecastFallbackUrl?: string | null
    languageCode?: string | null
    languageLabel?: string | null
    listenerPageEnabled?: boolean | null
    listenerTokenMode?: 'public' | 'password' | 'private' | null
    name: string
    recommendedTransport?: TransportKind | null
    slug: string
    speakerPageEnabled?: boolean | null
    speakerPasswordEnabled?: boolean | null
    transportStatus?: TransportStatus | null
    webrtcEnabled?: boolean | null
  }
  event: {
    defaultLanguage?: string | null
    listenerPasswordEnabled?: boolean | null
    publicListenerEnabled?: boolean | null
    slug: string
    speakerPasswordEnabled?: boolean | null
    status?: 'draft' | 'active' | 'archived' | null
    title: string
  }
  livekit: {
    roomName: string
    tokenEndpoint: string
    url?: string | null
  }
}

export type PublicEventDirectoryChannel = {
  description?: string | null
  enabled?: boolean | null
  languageCode?: string | null
  languageLabel?: string | null
  listenerTokenMode?: 'public' | 'password' | 'private' | null
  listenerUrl: string
  name: string
  slug: string
  webrtcEnabled?: boolean | null
}

export type PublicEventDirectoryResponse = {
  access: {
    listenerPasswordConfigured: boolean
    listenerPasswordMissing: boolean
    listenerPasswordRequired: boolean
    verifyPasswordEndpoint: string
  }
  channels: PublicEventDirectoryChannel[]
  event: {
    defaultLanguage?: string | null
    listenerPasswordEnabled?: boolean | null
    publicListenerEnabled?: boolean | null
    slug: string
    status?: 'draft' | 'active' | 'archived' | null
    title: string
    unifiedListenerQrEnabled?: boolean | null
  }
}

const DEFAULT_TOKEN_EXPIRY_SECONDS = 3600

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

/**
 * Resolves an event from a public URL segment, which is either the readable slug (normal
 * events) or the opaque publicId (events with Private links on). A readable slug never
 * resolves a private event, and an opaque id never resolves a non-private one — once
 * Private links is enabled, the old readable URL is dead.
 */
async function resolvePublicEvent(
  payload: Awaited<ReturnType<typeof getPayload>>,
  eventParam: string,
): Promise<Event | null> {
  const events = await payload.find({
    collection: 'events',
    depth: 1,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      or: [
        { and: [{ slug: { equals: eventParam } }, { privateLinksEnabled: { not_equals: true } }] },
        { and: [{ publicId: { equals: eventParam } }, { privateLinksEnabled: { equals: true } }] },
      ],
    },
  })

  return events.docs[0] ?? null
}

async function resolvePublicChannel(
  payload: Awaited<ReturnType<typeof getPayload>>,
  event: Event,
  channelParam: string,
): Promise<Channel | null> {
  const isPrivate = event.privateLinksEnabled === true
  const channels = await payload.find({
    collection: 'channels',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [
        { event: { equals: event.id } },
        isPrivate ? { publicId: { equals: channelParam } } : { slug: { equals: channelParam } },
      ],
    },
  })

  return channels.docs[0] ?? null
}

export async function getPublicChannelContext(
  eventSlug: string,
  channelSlug: string,
): Promise<PublicChannelContext | null> {
  const payload = await getPayload({ config: configPromise })
  const event = await resolvePublicEvent(payload, eventSlug)

  if (!event) {
    return null
  }

  const channel = await resolvePublicChannel(payload, event, channelSlug)

  if (!channel) {
    return null
  }

  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
  })
  const tokenExpiry = isPositiveNumber(settings.defaultTokenExpiry)
    ? settings.defaultTokenExpiry
    : DEFAULT_TOKEN_EXPIRY_SECONDS

  return {
    channel,
    event,
    roomName: channel.livekitRoomName || channel.roomName || `ablaut_${event.slug}_${channel.slug}`,
    settings,
    tokenExpiry,
  }
}

export function toPublicChannelResponse(
  context: PublicChannelContext,
  tokenEndpoint: '/api/livekit/listener-token' | '/api/livekit/speaker-token',
  request?: Request,
): PublicChannelResponse {
  const { channel, event, roomName, settings } = context
  const publicLanguage = resolvePublicLanguageFields(channel)
  const requestBaseUrl = request ? getRequestBaseUrlFromRequest(request) : null
  const streamInfo = resolveChannelStreamInfo({ channel, event, requestBaseUrl, settings })

  return {
    access: getListenerAccessInfo(context),
    channel: {
      description: channel.description,
      enabled: channel.enabled,
      hlsEnabled: channel.hlsEnabled,
      hlsUrl: streamInfo.hlsUrl,
      icecastFallbackUrl: streamInfo.fallbackUrl,
      languageCode: publicLanguage.languageCode,
      languageLabel: publicLanguage.languageLabel,
      listenerPageEnabled: channel.listenerPageEnabled,
      listenerTokenMode: channel.listenerTokenMode,
      name: channel.name,
      recommendedTransport: streamInfo.recommendedTransport,
      slug: effectiveChannelSegment(event, channel),
      speakerPageEnabled: channel.speakerPageEnabled,
      speakerPasswordEnabled: channel.speakerPasswordEnabled,
      transportStatus: streamInfo.transportStatus,
      webrtcEnabled: channel.webrtcEnabled,
    },
    event: {
      defaultLanguage: event.defaultLanguage,
      listenerPasswordEnabled: event.listenerPasswordEnabled,
      publicListenerEnabled: event.publicListenerEnabled,
      slug: effectiveEventSegment(event),
      speakerPasswordEnabled: event.speakerPasswordEnabled,
      status: event.status,
      title: event.title,
    },
    livekit: {
      roomName,
      tokenEndpoint,
      url:
        (request ? getBrowserLiveKitURL(request, settings.livekitPublicUrl) : undefined) ??
        settings.livekitPublicUrl ??
        process.env.LIVEKIT_PUBLIC_URL ??
        process.env.LIVEKIT_URL ??
        null,
    },
  }
}

export function isListenerPubliclyAvailable(context: PublicChannelContext): boolean {
  return (
    context.event.status === 'active' &&
    context.event.publicListenerEnabled !== false &&
    context.settings.allowPublicListenerPages !== false &&
    context.channel.enabled !== false &&
    context.channel.listenerPageEnabled !== false
  )
}

export function isListenerTokenAvailable(context: PublicChannelContext): boolean {
  return (
    isListenerPubliclyAvailable(context) &&
    context.event.listenerPasswordEnabled !== true &&
    context.channel.listenerTokenMode !== 'password' &&
    context.channel.listenerTokenMode !== 'private'
  )
}

export function isSpeakerPubliclyAvailable(context: PublicChannelContext): boolean {
  return (
    context.event.status === 'active' &&
    context.channel.enabled !== false &&
    context.channel.speakerPageEnabled !== false
  )
}

export function isSpeakerTokenAvailable(context: PublicChannelContext): boolean {
  return (
    isSpeakerPubliclyAvailable(context) &&
    context.event.speakerPasswordEnabled !== true &&
    context.channel.speakerPasswordEnabled !== true
  )
}

/** Speaker-page inline monitor: subscribe-only, bypasses listener password/private gates. */
export function canIssueListenerTokenForSpeakerMonitor(
  context: PublicChannelContext,
  hasSpeakerSession: boolean,
): boolean {
  return (
    isSpeakerPubliclyAvailable(context) &&
    context.channel.webrtcEnabled !== false &&
    hasSpeakerSession
  )
}

/** Speaker with a session on another channel in the same event can monitor other enabled channels. */
export function canIssueListenerTokenForSpeakerCrossMonitor(
  context: PublicChannelContext,
  hasSpeakerSessionOnPublishChannel: boolean,
): boolean {
  return (
    context.event.status === 'active' &&
    context.channel.enabled !== false &&
    context.channel.listenerTokenMode !== 'private' &&
    context.channel.webrtcEnabled !== false &&
    hasSpeakerSessionOnPublishChannel
  )
}

export async function getPublicEventBySlug(eventSlug: string): Promise<Event | null> {
  const payload = await getPayload({ config: configPromise })

  return resolvePublicEvent(payload, eventSlug)
}

export async function getEventChannelsForEvent(eventID: number): Promise<Channel[]> {
  const payload = await getPayload({ config: configPromise })
  const channels = await payload.find({
    collection: 'channels',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'sortOrder',
    where: {
      event: {
        equals: eventID,
      },
    },
  })

  return channels.docs
}

export async function getEnabledChannelsForEvent(eventID: number): Promise<Channel[]> {
  const payload = await getPayload({ config: configPromise })
  const channels = await payload.find({
    collection: 'channels',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'sortOrder',
    where: {
      and: [
        {
          event: {
            equals: eventID,
          },
        },
        {
          enabled: {
            equals: true,
          },
        },
      ],
    },
  })

  return channels.docs
}

export function isEventDirectoryAvailable(event: Event, settings: SiteSetting): boolean {
  return (
    event.status === 'active' &&
    event.publicListenerEnabled !== false &&
    event.unifiedListenerQrEnabled === true &&
    settings.allowPublicListenerPages !== false
  )
}

export function isDirectoryChannel(channel: Channel): boolean {
  return (
    channel.enabled !== false &&
    channel.listenerPageEnabled !== false &&
    channel.listenerTokenMode !== 'private'
  )
}

export function eventDirectoryPasswordRequired(
  event: Pick<Event, 'listenerPasswordEnabled'>,
): boolean {
  return event.listenerPasswordEnabled === true
}

export async function buildPublicEventDirectoryResponse(
  eventSlug: string,
  baseUrl: string,
): Promise<PublicEventDirectoryResponse | null> {
  const payload = await getPayload({ config: configPromise })
  const event = await getPublicEventBySlug(eventSlug)

  if (!event) {
    return null
  }

  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
  })

  if (!isEventDirectoryAvailable(event, settings)) {
    return null
  }

  const channels = await getEnabledChannelsForEvent(event.id)
  const passwordRequired = eventDirectoryPasswordRequired(event)
  const passwordConfigured = Boolean(event.listenerPasswordHash)

  return {
    access: {
      listenerPasswordConfigured: passwordConfigured,
      listenerPasswordMissing: passwordRequired && !passwordConfigured,
      listenerPasswordRequired: passwordRequired,
      verifyPasswordEndpoint: '/api/listener/verify-password',
    },
    channels: channels.filter(isDirectoryChannel).map((channel) => {
      const publicLanguage = resolvePublicLanguageFields(channel)
      const channelSegment = effectiveChannelSegment(event, channel)

      return {
        description: channel.description,
        languageCode: publicLanguage.languageCode,
        languageLabel: publicLanguage.languageLabel,
        listenerTokenMode: channel.listenerTokenMode,
        listenerUrl: getListenerUrl(effectiveEventSegment(event), channelSegment, baseUrl),
        name: channel.name,
        slug: channelSegment,
        webrtcEnabled: channel.webrtcEnabled,
      }
    }),
    event: {
      defaultLanguage: event.defaultLanguage,
      listenerPasswordEnabled: event.listenerPasswordEnabled,
      publicListenerEnabled: event.publicListenerEnabled,
      slug: effectiveEventSegment(event),
      status: event.status,
      title: event.title,
      unifiedListenerQrEnabled: event.unifiedListenerQrEnabled,
    },
  }
}

export async function getMonitorableChannelsForEvent(
  eventSlug: string,
  publishChannelSlug: string,
): Promise<PublicEventDirectoryChannel[]> {
  const event = await getPublicEventBySlug(eventSlug)

  if (!event) {
    return []
  }

  const channels = await getEventChannelsForEvent(event.id)
  const eventSegment = effectiveEventSegment(event)

  return channels
    .map((channel) => ({ channel, segment: effectiveChannelSegment(event, channel) }))
    .filter(({ segment }) => segment !== publishChannelSlug)
    .map(({ channel, segment }) => {
      const publicLanguage = resolvePublicLanguageFields(channel)

      return {
        description: channel.description,
        enabled: channel.enabled !== false,
        languageCode: publicLanguage.languageCode,
        languageLabel: publicLanguage.languageLabel,
        listenerTokenMode: channel.listenerTokenMode,
        listenerUrl: getListenerUrl(eventSegment, segment),
        name: channel.name,
        slug: segment,
        webrtcEnabled: channel.webrtcEnabled,
      }
    })
}
