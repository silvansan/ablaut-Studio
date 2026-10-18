import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { after } from 'next/server'

import { PrinterIcon } from '@/components/ActionIcons'
import { AddChannelButton } from '@/components/ChannelDrawer'
import { ChannelRow } from '@/components/ChannelRow'
import { EventWorkspaceHeader } from '@/components/EventWorkspaceHeader'
import { Layout } from '@/components/Layout'
import { ListBody, ListEmpty, ListPanel } from '@/components/ListKit'
import { getDashboardChannels, getDashboardEvent } from '@/lib/dashboard-data'
import { getEventSharePayload } from '@/lib/event-share'
import { loadEventWorkspace } from '@/lib/event-workspace'
import { eventListenerPasswordConfigured } from '@/lib/listener-password'
import { getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'
import { effectiveChannelSegment, effectiveEventSegment } from '@/lib/private-links'
import { recordEventAccess } from '@/lib/recent-events'
import type { Channel } from '@/payload-types'

type PageProps = {
  params: Promise<{ eventSlug: string }>
  searchParams: Promise<{ addChannel?: string; settings?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventSlug } = await params
  const event = await getDashboardEvent(eventSlug)

  return {
    title: event?.title ?? eventSlug,
  }
}

/** The browser gets the record to edit, never the stored speaker password hash. */
function withoutSecrets(channel: Channel): Channel {
  return { ...channel, speakerPassword: null, speakerPasswordHash: channel.speakerPasswordHash ? 'set' : null }
}

export default async function EventChannelsTab({ params, searchParams }: PageProps) {
  const { eventSlug } = await params
  const { addChannel, settings } = await searchParams

  // Old links (?settings=open) now land on the Settings tab.
  if (settings === 'open') {
    redirect(`/events/${eventSlug}/settings`)
  }

  const { canManageAssignments, canManageChannelsUser, event, fullEvent, payload, user } =
    await loadEventWorkspace(eventSlug)

  after(() => recordEventAccess(user, event.id))

  const [channels, channelRecords, publicBaseUrl, share] = await Promise.all([
    getDashboardChannels(eventSlug),
    canManageChannelsUser
      ? payload.find({
          collection: 'channels',
          depth: 0,
          limit: 200,
          overrideAccess: false,
          pagination: false,
          user,
          where: { event: { equals: event.id } },
        })
      : Promise.resolve({ docs: [] as Channel[] }),
    getRequestBaseUrl(),
    getEventSharePayload(eventSlug),
  ])
  const recordsByID = new Map(channelRecords.docs.map((channel) => [channel.id, withoutSecrets(channel)]))
  const passwordConfigured = eventListenerPasswordConfigured(fullEvent)
  const qrItems = share?.items ?? []
  const qrFor = (channelSlug: string, kind: 'listener' | 'speaker') =>
    qrItems.find((item) => item.channelSlug === channelSlug && item.kind === kind)
  const eventSegment = effectiveEventSegment(event)
  const rows = [...channels]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((channel) => ({
      channel,
      listenerUrl: getListenerUrl(eventSegment, effectiveChannelSegment(event, channel), publicBaseUrl),
      speakerUrl: getSpeakerUrl(eventSegment, effectiveChannelSegment(event, channel), publicBaseUrl),
    }))

  return (
    <Layout breadcrumbs={[{ label: event.title }]} hideHeader title={event.title}>
      <section className="space-y-4">
        <EventWorkspaceHeader canManage={canManageAssignments} event={event} eventSlug={eventSlug} />

        <ListPanel
          actions={
            <>
              {rows.length > 0
                ? ([
                    ['listener', 'Print listener QRs', 'One QR per page for your audience, plus the Android app QR.'],
                    ['speaker', 'Print speaker QRs', 'One QR per page for speakers and translators.'],
                  ] as const).map(([kind, label, hint]) => (
                    // New tab on purpose: the PDF viewer has its own print button, and the printer dialog
                    // lets people choose 1 or 2 pages per sheet.
                    <a
                      className="us-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
                      href={`/api/events/${encodeURIComponent(eventSlug)}/qr-pdf?kind=${kind}`}
                      key={kind}
                      rel="noreferrer"
                      target="_blank"
                      title={hint}
                    >
                      <PrinterIcon />
                      {label}
                    </a>
                  ))
                : null}
              {canManageChannelsUser ? (
                <AddChannelButton
                  defaultOpen={addChannel === '1'}
                  eventListenerPasswordConfigured={passwordConfigured}
                  eventSlug={eventSlug}
                />
              ) : null}
            </>
          }
          count={rows.length}
          title="Channels"
        >
          {rows.length > 0 ? (
            <ListBody itemLabel="channels">
              {rows.map((item) => (
                <ChannelRow
                  canDelete={canManageChannelsUser}
                  channel={recordsByID.get(item.channel.id)}
                  channelId={item.channel.id}
                  description={item.channel.description}
                  enabled={item.channel.enabled}
                  eventListenerPasswordConfigured={passwordConfigured}
                  eventSlug={eventSlug}
                  key={item.channel.slug}
                  listenerRoute={{
                    disabled: item.channel.listenerPageEnabled === false,
                    fileName: qrFor(item.channel.slug, 'listener')?.fileName,
                    qrDataUrl: qrFor(item.channel.slug, 'listener')?.qrDataUrl,
                    url: item.listenerUrl,
                  }}
                  name={item.channel.name}
                  slug={item.channel.slug}
                  speakerRoute={{
                    disabled: item.channel.speakerPageEnabled === false,
                    fileName: qrFor(item.channel.slug, 'speaker')?.fileName,
                    qrDataUrl: qrFor(item.channel.slug, 'speaker')?.qrDataUrl,
                    url: item.speakerUrl,
                  }}
                />
              ))}
            </ListBody>
          ) : (
            <ListEmpty>
              {canManageChannelsUser
                ? 'No channels yet. Add one for each language or audio feed.'
                : 'No channels yet. Ask an organization manager to add them for this event.'}
            </ListEmpty>
          )}
        </ListPanel>
      </section>
    </Layout>
  )
}
