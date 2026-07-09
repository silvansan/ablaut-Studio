import { getDashboardChannels, getDashboardEvent, type DashboardChannel, type DashboardEvent } from '@/lib/dashboard-data'
import {
  resolveBrandedQrChannelTitle,
  resolveBrandedQrOrganizationTitle,
} from '@/lib/branded-qrcode-labels'
import { getEventListenerUrl, getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'
import { generateBrandedRouteQrDataUrl, type BrandedQrStyle } from '@/lib/branded-qrcode'
import { getDefaultQrStyle } from '@/lib/qr-settings'

export type EventShareQrItem = {
  channelSlug?: string
  fileName: string
  kind: 'event-listener' | 'listener' | 'speaker'
  label: string
  name: string
  qrDataUrl: string
  url: string
}

export type EventSharePayload = {
  channels: DashboardChannel[]
  event: DashboardEvent
  items: EventShareQrItem[]
  publicBaseUrl: string
  qrStyle: BrandedQrStyle
  unifiedListenerQrEnabled: boolean
}

export async function getEventSharePayload(
  eventSlug: string,
  options?: { includeSpeaker?: boolean },
): Promise<EventSharePayload | null> {
  const includeSpeaker = options?.includeSpeaker !== false
  const [event, channels, publicBaseUrl, qrStyle] = await Promise.all([
    getDashboardEvent(eventSlug),
    getDashboardChannels(eventSlug),
    getRequestBaseUrl(),
    getDefaultQrStyle(),
  ])

  if (!event) {
    return null
  }

  const organizationName = resolveBrandedQrOrganizationTitle(event.organizationTitle)
  const sortedChannels = [...channels].sort((a, b) => a.name.localeCompare(b.name))
  const items: EventShareQrItem[] = []

  for (const channel of sortedChannels) {
    const channelName = resolveBrandedQrChannelTitle(channel.name, channel.slug)
    const listenerUrl = getListenerUrl(eventSlug, channel.slug, publicBaseUrl)
    const listenerQrDataUrl = await generateBrandedRouteQrDataUrl({
      channelName,
      organizationName,
      style: qrStyle,
      url: listenerUrl,
      variant: 'listener',
    })

    items.push({
      channelSlug: channel.slug,
      fileName: `${eventSlug}-${channel.slug}-listener.png`,
      kind: 'listener',
      label: 'Listener QR',
      name: channel.name,
      qrDataUrl: listenerQrDataUrl,
      url: listenerUrl,
    })

    if (includeSpeaker) {
      const speakerUrl = getSpeakerUrl(eventSlug, channel.slug, publicBaseUrl)
      const speakerQrDataUrl = await generateBrandedRouteQrDataUrl({
        channelName,
        organizationName,
        style: qrStyle,
        url: speakerUrl,
        variant: 'speaker',
      })

      items.push({
        channelSlug: channel.slug,
        fileName: `${eventSlug}-${channel.slug}-speaker.png`,
        kind: 'speaker',
        label: 'Speaker / translator QR',
        name: channel.name,
        qrDataUrl: speakerQrDataUrl,
        url: speakerUrl,
      })
    }
  }

  return {
    channels: sortedChannels,
    event,
    items,
    publicBaseUrl,
    qrStyle,
    unifiedListenerQrEnabled: false,
    // Placeholder; pages that know the full event flag can prepend the unified QR.
  }
}

export async function buildUnifiedEventListenerQr(input: {
  eventSlug: string
  eventTitle: string
  organizationTitle?: string | null
  publicBaseUrl: string
  qrStyle: BrandedQrStyle
}): Promise<EventShareQrItem> {
  const url = getEventListenerUrl(input.eventSlug, input.publicBaseUrl)
  const qrDataUrl = await generateBrandedRouteQrDataUrl({
    channelName: resolveBrandedQrChannelTitle(input.eventTitle, input.eventSlug),
    organizationName: resolveBrandedQrOrganizationTitle(input.organizationTitle),
    style: input.qrStyle,
    url,
    variant: 'listener',
  })

  return {
    fileName: `${input.eventSlug}-event-listener.png`,
    kind: 'event-listener',
    label: 'One QR for all languages',
    name: input.eventTitle,
    qrDataUrl,
    url,
  }
}

export function dataUrlToPngBuffer(dataUrl: string): Buffer | null {
  const match = /^data:image\/png;base64,(.+)$/i.exec(dataUrl)

  if (!match?.[1]) {
    return null
  }

  return Buffer.from(match[1], 'base64')
}
