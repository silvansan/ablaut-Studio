import configPromise from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { AppBreadcrumbs } from '@/components/AppBreadcrumbs'
import { ChannelAdvancedSettings } from '@/components/ChannelAdvancedSettings'
import { InlineEditField } from '@/components/InlineEditField'
import { Layout } from '@/components/Layout'
import { SharePanel } from '@/components/SharePanel'
import { requireAppUser } from '@/lib/app-auth'
import { formatEventChannelTitle } from '@/lib/branding'
import { channelEnabledChip } from '@/lib/active-status'
import { getDashboardChannel, getDashboardEvent } from '@/lib/dashboard-data'
import { getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'
import { effectiveChannelSegment, effectiveEventSegment } from '@/lib/private-links'
import { generateBrandedRouteQrDataUrl } from '@/lib/qrcode'
import { getDefaultQrStyle } from '@/lib/qr-settings'
import {
  resolveBrandedQrChannelTitle,
  resolveBrandedQrOrganizationTitle,
} from '@/lib/branded-qrcode-labels'
import { resolveChannelStreamInfo } from '@/lib/streaming/resolve-channel-stream'
import { updateChannelSummaryAction } from '@/app/events/[eventSlug]/channels/actions'
import { eventListenerPasswordConfigured } from '@/lib/listener-password'

type PageProps = {
  params: Promise<{ eventSlug: string; channelSlug: string }>
  searchParams: Promise<{ settings?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventSlug, channelSlug } = await params
  const [event, channel] = await Promise.all([
    getDashboardEvent(eventSlug),
    getDashboardChannel(eventSlug, channelSlug),
  ])

  const eventTitle = event?.title ?? eventSlug
  const channelName = channel?.name ?? channelSlug

  return {
    title: formatEventChannelTitle(eventTitle, channelName),
  }
}

export default async function ChannelDetailPage({ params, searchParams }: PageProps) {
  const { eventSlug, channelSlug } = await params
  const { settings: settingsQuery } = await searchParams
  const channel = await getDashboardChannel(eventSlug, channelSlug)

  if (!channel) {
    notFound()
  }

  const user = await requireAppUser()
  const event = await getDashboardEvent(eventSlug)
  const payload = await getPayload({ config: configPromise })
  const [channelsResult, eventsResult] = event
    ? await Promise.all([
        payload.find({
          collection: 'channels',
          depth: 0,
          limit: 1,
          overrideAccess: false,
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
                slug: {
                  equals: channelSlug,
                },
              },
            ],
          },
        }),
        payload.find({
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
        }),
      ])
    : [null, null]

  const channelSettings = channelsResult?.docs[0]
  const eventRecord = eventsResult?.docs[0]

  if (!channelSettings || !eventRecord) {
    notFound()
  }

  const listenerPasswordReady = eventListenerPasswordConfigured(eventRecord)
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
  })
  const streamInfo = resolveChannelStreamInfo({
    channel: channelSettings,
    event: eventRecord,
    settings,
  })

  const publicBaseUrl = await getRequestBaseUrl()
  const eventSegment = effectiveEventSegment(eventRecord)
  const channelSegment = effectiveChannelSegment(eventRecord, channelSettings)
  const listenerUrl = getListenerUrl(eventSegment, channelSegment, publicBaseUrl)
  const speakerUrl = getSpeakerUrl(eventSegment, channelSegment, publicBaseUrl)
  const organizationName = resolveBrandedQrOrganizationTitle(event?.organizationTitle)
  const channelName = resolveBrandedQrChannelTitle(channel.name, channelSlug)
  const qrStyle = await getDefaultQrStyle()
  const [listenerQrDataUrl, speakerQrDataUrl] = await Promise.all([
    generateBrandedRouteQrDataUrl({
      channelName,
      organizationName,
      style: qrStyle,
      url: listenerUrl,
      variant: 'listener',
    }),
    generateBrandedRouteQrDataUrl({
      channelName,
      organizationName,
      style: qrStyle,
      url: speakerUrl,
      variant: 'speaker',
    }),
  ])

  const channelStatus = channelEnabledChip(channel.enabled)

  return (
    <Layout hideHeader title={channel.name}>
      <section className="mx-auto max-w-6xl space-y-4">
        <AppBreadcrumbs
          segments={[
            ...(event?.organizationSlug
              ? [{ href: `/organizations/${event.organizationSlug}`, label: event.organizationTitle ?? 'Organization' }]
              : []),
            { href: `/events/${eventSlug}`, label: event?.title ?? eventSlug },
            { label: channel.name },
          ]}
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className={`us-chip ${channelStatus.className}`}>{channelStatus.label}</span>
          <Link className="us-button-secondary ml-auto px-3 py-2 text-sm font-medium" href={`/events/${eventSlug}`}>
            Back to event
          </Link>
        </div>

        <SharePanel
          canManage
          channels={[
            {
              channelId: channel.id,
              channelSlug,
              enabled: channel.enabled,
              listenerPageEnabled: channelSettings.listenerPageEnabled,
              listenerQrDataUrl,
              listenerUrl,
              name: channel.name,
              speakerPageEnabled: channelSettings.speakerPageEnabled,
              speakerQrDataUrl,
              speakerUrl,
            },
          ]}
          compact
          eventSlug={eventSlug}
          eventTitle={event?.title ?? eventSlug}
        />

        <article className="us-panel px-6 py-6">
          <div className="mt-1">
            <InlineEditField
              action={updateChannelSummaryAction}
              fieldName="name"
              hiddenFields={{ channelSlug, eventSlug, id: channel.id }}
              inputLabel="Channel name"
              value={channel.name}
            >
              <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                {channel.name}
              </h2>
            </InlineEditField>
          </div>
          <div className="mt-3">
            <InlineEditField
              action={updateChannelSummaryAction}
              fieldName="description"
              hiddenFields={{ channelSlug, eventSlug, id: channel.id }}
              inputLabel="Description"
              multiline
              placeholder="Add a short channel description"
              value={channel.description ?? ''}
            >
              <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                {channel.description || 'No description yet.'}
              </p>
            </InlineEditField>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {streamInfo.webrtcAvailable ? <span className="us-chip us-chip-blue">WebRTC available</span> : <span className="us-chip us-chip-warning">WebRTC off</span>}
            {streamInfo.hlsAvailable ? <span className="us-chip us-chip-blue">HLS available</span> : null}
            {streamInfo.hlsEgressStatus === 'live' ? <span className="us-chip us-chip-muted">HLS live</span> : null}
            {streamInfo.hlsEgressStatus === 'starting' ? <span className="us-chip us-chip-muted">HLS starting</span> : null}
            {streamInfo.hlsEgressStatus === 'error' ? <span className="us-chip us-chip-warning">HLS error</span> : null}
            {streamInfo.fallbackUrl ? <span className="us-chip us-chip-blue">External fallback</span> : null}
          </div>
        </article>

        <ChannelAdvancedSettings
          channel={channelSettings}
          defaultOpen={settingsQuery === 'open'}
          eventListenerPasswordConfigured={listenerPasswordReady}
          eventSlug={eventSlug}
        />
      </section>
    </Layout>
  )
}
