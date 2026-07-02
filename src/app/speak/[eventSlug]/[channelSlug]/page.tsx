import { cookies } from 'next/headers'
import type { Metadata } from 'next'

import { Layout } from '@/components/Layout'
import { RouteActionCluster } from '@/components/RouteActionCluster'
import { SpeakerAccessPanel } from '@/components/SpeakerAccessPanel'
import { SpeakerChannelMonitor } from '@/components/SpeakerChannelMonitor'
import { formatEventChannelTitle } from '@/lib/branding'
import { getListenerUrl, getRequestBaseUrl } from '@/lib/links'
import { getMonitorableChannelsForEvent, getPublicChannelContext, isSpeakerPubliclyAvailable } from '@/lib/public-channel'
import { generateBrandedRouteQrDataUrl } from '@/lib/qrcode'
import {
  resolveBrandedQrChannelTitle,
  resolveBrandedQrOrganizationTitle,
} from '@/lib/branded-qrcode-labels'
import {
  getSpeakerSessionCookieName,
  speakerPasswordRequired,
  verifySpeakerSessionToken,
} from '@/lib/speaker-password'

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

export default async function SpeakPage({ params }: PageProps) {
  const { eventSlug, channelSlug } = await params
  const context = await getPublicChannelContext(eventSlug, channelSlug)
  const speakerAvailable = context ? isSpeakerPubliclyAvailable(context) : true
  const passwordRequired = context ? speakerPasswordRequired(context) : false
  const speakerCookies = await cookies()
  const sessionCookie = speakerCookies.get(getSpeakerSessionCookieName(eventSlug, channelSlug))?.value
  const hasSpeakerSession =
    !passwordRequired || verifySpeakerSessionToken(eventSlug, channelSlug, sessionCookie)
  const eventTitle = context?.event.title ?? eventSlug
  const channelDisplayName = context?.channel.name ?? channelSlug
  const publicBaseUrl = await getRequestBaseUrl()
  const listenerUrl = getListenerUrl(eventSlug, channelSlug, publicBaseUrl)
  const organization =
    context && typeof context.event.organization === 'object' ? context.event.organization : null
  const organizationName = resolveBrandedQrOrganizationTitle(organization?.name)
  const channelName = resolveBrandedQrChannelTitle(channelDisplayName, channelSlug)
  const listenerQrDataUrl = await generateBrandedRouteQrDataUrl({
    channelName,
    organizationName,
    url: listenerUrl,
    variant: 'listener',
  })
  const monitorChannels = context ? await getMonitorableChannelsForEvent(eventSlug, channelSlug) : []

  return (
    <Layout hideHeader requireAuth={false} title="Speak">
      <section className="mx-auto max-w-4xl space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="us-panel px-6 py-7">
            <span className={`us-chip ${speakerAvailable ? 'us-chip-muted' : 'us-chip-warning'}`}>
              {speakerAvailable ? 'Protected speaker route' : 'Speaker route unavailable'}
            </span>
            <div className="mt-5">
              <p className="text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--us-blue-dark)' }}>
                {eventTitle}
              </p>
              <h2 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl" style={{ color: 'var(--us-green-dark)' }}>
                {channelDisplayName}
              </h2>
            </div>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              Publish audio to this channel
            </h3>
            {context ? (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                  Listener check
                </p>
                {hasSpeakerSession ? (
                  <SpeakerChannelMonitor
                    currentChannel={{
                      languageLabel: context.channel.languageLabel,
                      name: channelDisplayName,
                      slug: channelSlug,
                      webrtcEnabled: context.channel.webrtcEnabled,
                    }}
                    eventSlug={eventSlug}
                    fallbackUrl={context.channel.icecastFallbackUrl}
                    monitorChannels={monitorChannels}
                    publishChannelSlug={channelSlug}
                  />
                ) : (
                  <p className="rounded-2xl border bg-white/70 px-4 py-4 text-sm leading-6" style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}>
                    Unlock speaker controls to monitor listener audio on this channel or others in the event.
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <RouteActionCluster
                    openLabel="Open listener page"
                    qrDataUrl={listenerQrDataUrl}
                    qrFileName={`${eventSlug}-${channelSlug}-listener.png`}
                    qrLabel="Listener"
                    qrTriggerLabel="Listener QR"
                    url={listenerUrl}
                    variant="listener"
                  />
                </div>
              </div>
            ) : null}
          </article>

          {speakerAvailable ? (
            <SpeakerAccessPanel
              audioQualityDefaults={{
                autoGainControl: context?.channel.audioQuality?.autoGainControl ?? false,
                echoCancellation: context?.channel.audioQuality?.echoCancellation ?? false,
                noiseSuppression: context?.channel.audioQuality?.noiseSuppression ?? false,
              }}
              channelSlug={channelSlug}
              eventSlug={eventSlug}
              hasAccess={hasSpeakerSession}
              passwordRequired={passwordRequired}
            />
          ) : (
            <article className="us-panel px-6 py-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                Not available
              </p>
              <p className="mt-4 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                This speaker route is disabled or the event is not active.
              </p>
            </article>
          )}
        </div>
      </section>
    </Layout>
  )
}
