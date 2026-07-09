'use client'

import Link from 'next/link'
import { useState } from 'react'

import { setChannelPageEnabledAction } from '@/app/events/[eventSlug]/channels/actions'
import { IconActionLink } from '@/components/ActionIcons'
import { ActionFeedbackForm } from '@/components/ActionFeedbackForm'
import { RouteActionCluster } from '@/components/RouteActionCluster'
import { ShareZipButton } from '@/components/ShareZipButton'
import { channelEnabledChip } from '@/lib/active-status'
import { APP_NOTICES } from '@/lib/app-notices'

export type ShareChannelBlock = {
  channelId: number
  channelSlug: string
  enabled?: boolean | null
  listenerPageEnabled?: boolean | null
  listenerQrDataUrl?: string
  listenerUrl: string
  name: string
  speakerPageEnabled?: boolean | null
  speakerQrDataUrl?: string
  speakerUrl: string
}

type SharePanelProps = {
  canManage?: boolean
  channels: ShareChannelBlock[]
  compact?: boolean
  eventSlug: string
  eventTitle: string
  unifiedListenerQrDataUrl?: string
  unifiedListenerQrEnabled?: boolean
  unifiedListenerUrl?: string
}

function CopyLinkButton({ label, url }: { label: string; url: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
      window.setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('failed')
    }
  }

  const buttonLabel =
    state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : label

  return (
    <button className="us-button-secondary px-3 py-2 text-sm font-medium" onClick={() => void copyLink()} type="button">
      {buttonLabel}
    </button>
  )
}

function ShareRouteRow({
  disabled,
  eventSlug,
  fileName,
  name,
  qrDataUrl,
  qrLabel,
  qrTriggerLabel,
  url,
  variant,
}: {
  disabled?: boolean
  eventSlug: string
  fileName: string
  name: string
  qrDataUrl?: string
  qrLabel: string
  qrTriggerLabel: string
  url: string
  variant: 'listener' | 'speaker'
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <RouteActionCluster
        disabled={disabled}
        openLabel={variant === 'listener' ? 'Open listener page' : 'Open speaker page'}
        qrDataUrl={qrDataUrl}
        qrFileName={fileName}
        qrLabel={qrLabel}
        qrTriggerLabel={qrTriggerLabel}
        url={url}
        variant={variant}
      />
      <CopyLinkButton label="Copy link" url={url} />
      <span className="text-xs" style={{ color: 'var(--us-muted)' }}>
        {name}
      </span>
      <span className="sr-only">{eventSlug}</span>
    </div>
  )
}

function ChannelPageToggle({
  channelId,
  channelSlug,
  enabled,
  eventSlug,
  page,
}: {
  channelId: number
  channelSlug: string
  enabled: boolean
  eventSlug: string
  page: 'listener' | 'speaker'
}) {
  const label = page === 'listener' ? 'Listener page' : 'Speaker page'

  return (
    <ActionFeedbackForm action={setChannelPageEnabledAction} className="inline-flex items-center gap-2">
      <input name="channelSlug" type="hidden" value={channelSlug} />
      <input name="enabled" type="hidden" value={enabled ? 'false' : 'true'} />
      <input name="eventSlug" type="hidden" value={eventSlug} />
      <input name="id" type="hidden" value={channelId} />
      <input name="page" type="hidden" value={page} />
      <span className="text-xs font-medium" style={{ color: 'var(--us-muted)' }}>
        {label}
      </span>
      <button
        className={`rounded-full px-3 py-1 text-xs font-semibold ${enabled ? 'us-chip us-chip-blue' : 'us-chip us-chip-muted'}`}
        type="submit"
      >
        {enabled ? 'On' : 'Off'}
      </button>
    </ActionFeedbackForm>
  )
}

export function SharePanel({
  canManage = false,
  channels,
  compact = false,
  eventSlug,
  eventTitle,
  unifiedListenerQrDataUrl,
  unifiedListenerQrEnabled = false,
  unifiedListenerUrl,
}: SharePanelProps) {
  const hubHref = `/events/${eventSlug}/share`

  if (compact) {
    const channel = channels[0]

    if (!channel) {
      return null
    }

    return (
      <article className="us-panel us-share-strip px-4 py-4">
        <p className="w-full text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
          Share this channel
        </p>
        <ShareRouteRow
          disabled={channel.listenerPageEnabled === false}
          eventSlug={eventSlug}
          fileName={`${eventSlug}-${channel.channelSlug}-listener.png`}
          name="Listener QR"
          qrDataUrl={channel.listenerQrDataUrl}
          qrLabel={`${channel.name} listener`}
          qrTriggerLabel="Listener QR"
          url={channel.listenerUrl}
          variant="listener"
        />
        <ShareRouteRow
          disabled={channel.speakerPageEnabled === false}
          eventSlug={eventSlug}
          fileName={`${eventSlug}-${channel.channelSlug}-speaker.png`}
          name="Speaker / translator QR"
          qrDataUrl={channel.speakerQrDataUrl}
          qrLabel={`${channel.name} speaker`}
          qrTriggerLabel="Speaker / translator QR"
          url={channel.speakerUrl}
          variant="speaker"
        />
        <Link className="us-button-secondary ml-auto px-3 py-2 text-sm font-medium" href={hubHref}>
          All event QRs
        </Link>
      </article>
    )
  }

  const allUrls = [
    ...(unifiedListenerQrEnabled && unifiedListenerUrl ? [unifiedListenerUrl] : []),
    ...channels.flatMap((channel) => [channel.listenerUrl, channel.speakerUrl]),
  ]

  async function copyAllLinks() {
    try {
      await navigator.clipboard.writeText(allUrls.join('\n'))
    } catch {
      window.alert(APP_NOTICES.copyLinkFailed)
    }
  }

  return (
    <article className="us-panel px-5 py-5" id="share">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Share &amp; print
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
            QR codes and links for {eventTitle}. Print for signage or send links to your team.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" onClick={() => void copyAllLinks()} type="button">
            Copy all links
          </button>
          <ShareZipButton eventSlug={eventSlug} />
          <Link className="us-button-secondary px-4 py-2.5 text-sm font-medium" href={hubHref}>
            Print page
          </Link>
        </div>
      </div>

      {unifiedListenerQrEnabled && unifiedListenerUrl ? (
        <section className="mt-5 rounded-2xl border bg-white/60 px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
            One QR for all languages
          </p>
          <p className="mt-1 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
            Listeners pick their channel after scanning.
          </p>
          <div className="mt-3">
            <ShareRouteRow
              eventSlug={eventSlug}
              fileName={`${eventSlug}-event-listener.png`}
              name="Event listener directory"
              qrDataUrl={unifiedListenerQrDataUrl}
              qrLabel={`${eventTitle} listener directory`}
              qrTriggerLabel="One QR for all languages"
              url={unifiedListenerUrl}
              variant="listener"
            />
          </div>
        </section>
      ) : null}

      <div className="mt-5 space-y-0">
        {channels.length === 0 ? (
          <p className="text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
            Add a channel to generate listener and speaker QRs.
          </p>
        ) : (
          channels.map((channel) => {
            const statusChip = channelEnabledChip(channel.enabled)

            return (
              <section className="us-share-hub__channel" key={channel.channelSlug}>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                    {channel.name}
                  </h3>
                  <span className={`us-chip ${statusChip.className}`}>{statusChip.label}</span>
                  <span className="ml-auto">
                    <IconActionLink
                      href={`/events/${eventSlug}/channels/${channel.channelSlug}`}
                      icon="open"
                    >
                      Channel details
                    </IconActionLink>
                  </span>
                </div>

                {canManage ? (
                  <div className="mt-2 flex flex-wrap gap-4">
                    <ChannelPageToggle
                      channelId={channel.channelId}
                      channelSlug={channel.channelSlug}
                      enabled={channel.listenerPageEnabled !== false}
                      eventSlug={eventSlug}
                      page="listener"
                    />
                    <ChannelPageToggle
                      channelId={channel.channelId}
                      channelSlug={channel.channelSlug}
                      enabled={channel.speakerPageEnabled !== false}
                      eventSlug={eventSlug}
                      page="speaker"
                    />
                  </div>
                ) : null}

                <div className="mt-3 space-y-2">
                  <ShareRouteRow
                    disabled={channel.listenerPageEnabled === false}
                    eventSlug={eventSlug}
                    fileName={`${eventSlug}-${channel.channelSlug}-listener.png`}
                    name="Listener QR"
                    qrDataUrl={channel.listenerQrDataUrl}
                    qrLabel={`${channel.name} listener`}
                    qrTriggerLabel="Listener QR"
                    url={channel.listenerUrl}
                    variant="listener"
                  />
                  <ShareRouteRow
                    disabled={channel.speakerPageEnabled === false}
                    eventSlug={eventSlug}
                    fileName={`${eventSlug}-${channel.channelSlug}-speaker.png`}
                    name="Speaker / translator QR"
                    qrDataUrl={channel.speakerQrDataUrl}
                    qrLabel={`${channel.name} speaker`}
                    qrTriggerLabel="Speaker / translator QR"
                    url={channel.speakerUrl}
                    variant="speaker"
                  />
                </div>
              </section>
            )
          })
        )}
      </div>
    </article>
  )
}
