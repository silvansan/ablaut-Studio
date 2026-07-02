import Link from 'next/link'
import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canManageChannels, createChannelAction } from '@/app/events/[eventSlug]/channels/actions'
import { requireAppUser } from '@/lib/app-auth'
import { ChannelsHubTable } from '@/components/ChannelsHubTable'
import { Layout } from '@/components/Layout'
import { PanelDrawer } from '@/components/PanelDrawer'
import { getDashboardAllChannels, getDashboardEvents } from '@/lib/dashboard-data'
import { assignGroupTints } from '@/lib/list-group-tints'
import { getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'
import { pageMetadata } from '@/lib/branding'
import { generateBrandedRouteQrDataUrl } from '@/lib/qrcode'
import {
  resolveBrandedQrChannelTitle,
  resolveBrandedQrOrganizationTitle,
} from '@/lib/branded-qrcode-labels'

export const metadata: Metadata = pageMetadata('Channels')

export const dynamic = 'force-dynamic'

type ChannelsPageProps = {
  searchParams?: Promise<{
    event?: string
    q?: string
  }>
}

export default async function ChannelsPage({ searchParams }: ChannelsPageProps) {
  const params = await searchParams
  const selectedEvent = params?.event ?? ''
  const searchQuery = params?.q?.trim() ?? ''
  const normalizedQuery = searchQuery.toLowerCase()
  const [channels, events, publicBaseUrl, user] = await Promise.all([
    getDashboardAllChannels(1000),
    getDashboardEvents(1000),
    getRequestBaseUrl(),
    requireAppUser(),
  ])
  const payload = await getPayload({ config: configPromise })
  const eventsWithManageAccess = await Promise.all(
    events.map(async (event) => ({
      ...event,
      canManage: await canManageChannels(payload, user, event.id),
    })),
  )
  const manageableEvents = eventsWithManageAccess.filter((event) => event.canManage)
  const filteredChannels = channels.filter((channel) => {
    const matchesEvent = !selectedEvent || channel.eventSlug === selectedEvent
    const matchesQuery =
      !normalizedQuery ||
      [channel.name, channel.languageCode, channel.languageLabel, channel.eventTitle]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))

    return matchesEvent && matchesQuery
  })
  const sortedChannels = [...filteredChannels].sort((a, b) => {
    const eventCompare = a.eventTitle.localeCompare(b.eventTitle)

    if (eventCompare !== 0) {
      return eventCompare
    }

    return a.name.localeCompare(b.name)
  })
  const tintedChannels = assignGroupTints(sortedChannels, (channel) => channel.eventSlug)
  const channelRows = await Promise.all(
    tintedChannels.map(async (channel) => {
      const listenerUrl = getListenerUrl(channel.eventSlug, channel.slug, publicBaseUrl)
      const speakerUrl = getSpeakerUrl(channel.eventSlug, channel.slug, publicBaseUrl)
      const organizationName = resolveBrandedQrOrganizationTitle(channel.organizationTitle)
      const channelName = resolveBrandedQrChannelTitle(channel.name, channel.slug)
      const [listenerQrDataUrl, speakerQrDataUrl, canDelete] = await Promise.all([
        generateBrandedRouteQrDataUrl({
          channelName,
          organizationName,
          url: listenerUrl,
          variant: 'listener',
        }),
        generateBrandedRouteQrDataUrl({
          channelName,
          organizationName,
          url: speakerUrl,
          variant: 'speaker',
        }),
        canManageChannels(payload, user, channel.eventID),
      ])

      return {
        ...channel,
        canDelete,
        listenerQrDataUrl,
        listenerUrl,
        speakerQrDataUrl,
        speakerUrl,
      }
    }),
  )

  const returnParams = new URLSearchParams()

  if (selectedEvent) {
    returnParams.set('event', selectedEvent)
  }

  if (searchQuery) {
    returnParams.set('q', searchQuery)
  }

  const returnPath = returnParams.toString() ? `/channels?${returnParams.toString()}` : '/channels'

  return (
    <Layout hideHeader title="Channels">
      <section className="space-y-4">
        <article className="us-panel px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Find channels
          </p>
          <form className="mt-4 grid gap-3 lg:grid-cols-[220px_1fr_auto]" action="/channels">
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Event
              <select
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={selectedEvent}
                name="event"
                style={{ borderColor: 'var(--us-border)' }}
              >
                <option value="">All events</option>
                {events.map((event) => (
                  <option key={event.slug} value={event.slug}>
                    {event.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Channel search
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={searchQuery}
                name="q"
                placeholder="Name, language, or event"
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>
            <div className="flex items-end gap-2">
              <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
                Filter
              </button>
              <Link className="us-button-secondary px-4 py-3 text-sm font-medium" href="/channels">
                Clear
              </Link>
            </div>
          </form>
        </article>

        {manageableEvents.length > 0 ? (
          <PanelDrawer description="Create a channel without opening the event page first." title="Quick add channel">
            <form action={createChannelAction} className="grid gap-3 lg:grid-cols-[220px_1fr_auto]">
              <input name="enabled" type="hidden" value="on" />
              <input name="listenerPageEnabled" type="hidden" value="on" />
              <input name="listenerTokenMode" type="hidden" value="public" />
              <input name="speakerPageEnabled" type="hidden" value="on" />
              <input name="webrtcEnabled" type="hidden" value="on" />
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Event
                <select
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  defaultValue={selectedEvent}
                  name="eventSlug"
                  required
                  style={{ borderColor: 'var(--us-border)' }}
                >
                  <option value="">Choose event</option>
                  {manageableEvents.map((event) => (
                    <option key={event.slug} value={event.slug}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Channel name
                <input
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  name="name"
                  placeholder="English floor audio"
                  required
                  style={{ borderColor: 'var(--us-border)' }}
                />
              </label>
              <div className="flex items-end">
                <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
                  Add
                </button>
              </div>
            </form>
          </PanelDrawer>
        ) : null}

        <ChannelsHubTable
          channels={channelRows.map((channel) => ({
            canDelete: channel.canDelete,
            channelId: channel.id,
            description: channel.eventTitle,
            enabled: channel.enabled,
            eventSlug: channel.eventSlug,
            listenerPageEnabled: channel.listenerPageEnabled,
            listenerQrDataUrl: channel.listenerQrDataUrl,
            listenerUrl: channel.listenerUrl,
            name: channel.name,
            rowTint: channel.rowTint,
            slug: channel.slug,
            speakerPageEnabled: channel.speakerPageEnabled,
            speakerQrDataUrl: channel.speakerQrDataUrl,
            speakerUrl: channel.speakerUrl,
          }))}
          returnPath={returnPath}
        />
      </section>
    </Layout>
  )
}
