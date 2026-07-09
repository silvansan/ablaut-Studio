'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

import { channelEnabledChip } from '@/lib/active-status'

export type GoLiveChannelItem = {
  enabled?: boolean | null
  listenerPageEnabled?: boolean | null
  listenerUrl: string
  name: string
  slug: string
  speakerPageEnabled?: boolean | null
  speakerUrl: string
}

type GoLiveWizardProps = {
  channels: GoLiveChannelItem[]
  eventSlug: string
  eventTitle: string
  publicListenerEnabled?: boolean | null
  shareHref: string
}

function ChecklistRow({
  children,
  done,
  title,
}: {
  children?: ReactNode
  done: boolean
  title: string
}) {
  return (
    <li className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-bold ${done ? 'us-chip us-chip-blue' : 'us-chip us-chip-muted'}`}
        >
          {done ? '✓' : '·'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
            {title}
          </p>
          {children ? <div className="mt-2 space-y-2">{children}</div> : null}
        </div>
      </div>
    </li>
  )
}

export function GoLiveWizard({
  channels,
  eventSlug,
  eventTitle,
  publicListenerEnabled,
  shareHref,
}: GoLiveWizardProps) {
  const enabledChannels = channels.filter((channel) => channel.enabled !== false)
  const channelsReady = channels.length > 0 && enabledChannels.length === channels.length
  const listenerPagesReady =
    enabledChannels.length > 0 &&
    enabledChannels.every((channel) => channel.listenerPageEnabled !== false && publicListenerEnabled !== false)
  const speakerPagesReady =
    enabledChannels.length > 0 && enabledChannels.every((channel) => channel.speakerPageEnabled !== false)
  const allStepsDone = channelsReady && listenerPagesReady && speakerPagesReady

  return (
    <article className="us-panel px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Go live
          </p>
          <p className="mt-2 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
            Event-day checklist for {eventTitle}. Work through each step before doors open.
          </p>
        </div>
        <Link className="us-button-primary px-4 py-2.5 text-sm font-medium" href={shareHref}>
          Share &amp; print
        </Link>
      </div>

      <ul className="mt-5 space-y-3">
        <ChecklistRow done={channelsReady} title="Channels are enabled">
          {channels.length === 0 ? (
            <p className="text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
              Add at least one channel for this event.
            </p>
          ) : (
            <ul className="space-y-2">
              {channels.map((channel) => {
                const status = channelEnabledChip(channel.enabled)

                return (
                  <li className="flex flex-wrap items-center gap-2 text-sm" key={channel.slug}>
                    <span className={`us-chip ${status.className}`}>{status.label}</span>
                    <span style={{ color: 'var(--us-text)' }}>{channel.name}</span>
                    <Link
                      className="font-medium hover:underline"
                      href={`/events/${eventSlug}/channels/${channel.slug}`}
                      style={{ color: 'var(--us-blue-dark)' }}
                    >
                      Open
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </ChecklistRow>

        <ChecklistRow done={listenerPagesReady} title="Listener pages and QRs are ready">
          {publicListenerEnabled === false ? (
            <p className="text-sm leading-6" style={{ color: 'var(--us-danger)' }}>
              Public listeners are turned off for this event. Enable them in Settings.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Link className="us-button-secondary px-3 py-2 text-sm font-medium" href={shareHref}>
                Open share hub
              </Link>
              {enabledChannels[0] ? (
                <a
                  className="us-button-secondary px-3 py-2 text-sm font-medium"
                  href={enabledChannels[0].listenerUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Test listener page
                </a>
              ) : null}
            </div>
          )}
        </ChecklistRow>

        <ChecklistRow done={speakerPagesReady} title="Speaker / translator pages are ready">
          <div className="flex flex-wrap gap-2">
            {enabledChannels.map((channel) => (
              <a
                className="us-button-secondary px-3 py-2 text-sm font-medium"
                href={channel.speakerUrl}
                key={channel.slug}
                rel="noreferrer"
                target="_blank"
              >
                {channel.name} speaker
              </a>
            ))}
          </div>
        </ChecklistRow>
      </ul>

      {allStepsDone ? (
        <p className="mt-4 rounded-2xl border px-4 py-3 text-sm leading-6" style={{ borderColor: 'var(--us-green)', color: 'var(--us-green-dark)' }}>
          Ready to go live. Print QRs from Share &amp; print and run a quick listener test on a phone.
        </p>
      ) : null}
    </article>
  )
}
