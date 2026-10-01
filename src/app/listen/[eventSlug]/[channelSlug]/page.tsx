import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

import { Layout } from '@/components/Layout'
import { ListenerConnectPanel } from '@/components/ListenerConnectPanel'
import { getListenerSessionCookieName, verifyListenerSessionToken } from '@/lib/listener-password'
import { formatEventChannelTitle } from '@/lib/branding'
import { getRequestBaseUrl } from '@/lib/links'
import { getPublicChannelContext, isListenerPubliclyAvailable } from '@/lib/public-channel'
import {
  buildHlsManifestUrl,
  resolveHlsPlaylistName,
  resolveHlsPublicBaseUrl,
} from '@/lib/streaming/build-hls-url'
import { resolveChannelStreamInfo } from '@/lib/streaming/resolve-channel-stream'

type PageProps = {
  params: Promise<{ eventSlug: string; channelSlug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventSlug, channelSlug } = await params
  const context = await getPublicChannelContext(eventSlug, channelSlug)
  const eventTitle = context?.event.title ?? eventSlug
  const channelName = context?.channel.name ?? channelSlug

  return {
    title: formatEventChannelTitle(eventTitle, channelName),
  }
}

export default async function ListenPage({ params }: PageProps) {
  const { eventSlug, channelSlug } = await params
  const context = await getPublicChannelContext(eventSlug, channelSlug)

  if (!context) {
    notFound()
  }

  const listenerAvailable = isListenerPubliclyAvailable(context)
  const eventTitle = context.event.title
  const channelName = context.channel.name
  const cookieStore = await cookies()
  const listenerSession = cookieStore.get(getListenerSessionCookieName(eventSlug, channelSlug))?.value
  const hasListenerSession = verifyListenerSessionToken(eventSlug, channelSlug, listenerSession)
  const requestBaseUrl = await getRequestBaseUrl()
  const streamInfo = resolveChannelStreamInfo({
    channel: context.channel,
    event: context.event,
    preferSafariCompatibility: true,
    requestBaseUrl,
    settings: context.settings,
  })
  const hlsCandidateUrl =
    context.channel.hlsEnabled === true
      ? buildHlsManifestUrl(
          eventSlug,
          channelSlug,
          resolveHlsPublicBaseUrl(context.settings, requestBaseUrl),
          resolveHlsPlaylistName(context.settings),
        )
      : null

  return (
    <Layout hideHeader requireAuth={false} title="Listen">
      <section className="mx-auto max-w-2xl">
        <div className="us-panel us-hero-glow relative overflow-hidden px-6 py-8 text-center md:px-8">
          <div className="relative z-10">
            <span className={`us-chip ${listenerAvailable ? 'us-chip-blue' : 'us-chip-warning'}`}>
              {listenerAvailable ? 'Public listener route' : 'Listener route unavailable'}
            </span>
            <div className="mt-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--us-blue-dark)' }}>
                {eventTitle}
              </p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl" style={{ color: 'var(--us-green-dark)' }}>
                {channelName}
              </h2>
            </div>
            <h3 className="mt-4 text-xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              Choose how to listen
            </h3>
            {listenerAvailable ? (
              <ListenerConnectPanel
                channelName={channelName}
                channelSlug={channelSlug}
                eventSlug={eventSlug}
                eventTitle={eventTitle}
                fallbackUrl={streamInfo?.fallbackUrl}
                hasListenerSession={hasListenerSession}
                hlsEnabled={context?.channel.hlsEnabled}
                hlsEgressStatus={streamInfo?.hlsEgressStatus ?? null}
                hlsUrl={streamInfo?.hlsUrl ?? hlsCandidateUrl}
                listenerPasswordEnabled={context?.event.listenerPasswordEnabled}
                listenerTokenMode={context?.channel.listenerTokenMode}
                webrtcEnabled={context?.channel.webrtcEnabled}
              />
            ) : (
              <p className="mt-6 rounded-2xl border px-4 py-4 text-sm" style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}>
                This listener channel is disabled or the event is not active.
              </p>
            )}
          </div>
        </div>
      </section>
    </Layout>
  )
}
