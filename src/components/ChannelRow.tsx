'use client'

import { useRouter } from 'next/navigation'

import { deleteChannelAction } from '@/app/events/[eventSlug]/channels/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { RouteActionCluster } from '@/components/RouteActionCluster'
import { channelEnabledChip } from '@/lib/active-status'
import { rowTintClass, type ListRowTint } from '@/lib/list-group-tints'

type ChannelRowProps = {
  canDelete?: boolean
  channelId: number
  description?: string | null
  enabled?: boolean | null
  eventSlug: string
  listenerPageEnabled?: boolean | null
  listenerQrDataUrl?: string
  listenerUrl: string
  name: string
  rowTint?: ListRowTint
  slug: string
  speakerPageEnabled?: boolean | null
  speakerQrDataUrl?: string
  speakerUrl: string
}

export function ChannelRow({
  canDelete = false,
  channelId,
  description,
  enabled,
  eventSlug,
  listenerPageEnabled,
  listenerQrDataUrl,
  listenerUrl,
  name,
  rowTint = 'white',
  slug,
  speakerPageEnabled,
  speakerQrDataUrl,
  speakerUrl,
}: ChannelRowProps) {
  const router = useRouter()
  const href = `/events/${eventSlug}/channels/${slug}`
  const deleteFormId = `delete-channel-${channelId}`
  const statusChip = channelEnabledChip(enabled)

  function openRow() {
    router.push(href)
  }

  return (
    <li
      className={`us-data-row us-data-row--cols-3 cursor-pointer rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md ${rowTintClass(rowTint)}`}
      onClick={openRow}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openRow()
        }
      }}
      role="link"
      style={{ borderColor: 'var(--us-border)' }}
      tabIndex={0}
    >
      <div className="us-data-row__lead">
        <span className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          {name}
        </span>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-5" style={{ color: 'var(--us-muted)' }}>
            {description}
          </p>
        ) : null}
      </div>

      <div className="us-data-row__chips">
        <span className={`us-chip ${statusChip.className}`}>{statusChip.label}</span>
      </div>

      <div className="us-data-row__actions" onClick={(event) => event.stopPropagation()}>
        <RouteActionCluster
          disabled={speakerPageEnabled === false}
          openLabel="Open speaker page"
          qrDataUrl={speakerQrDataUrl}
          qrFileName={`${eventSlug}-${slug}-speaker.png`}
          qrLabel={`${name} speaker`}
          qrTriggerLabel="Show speaker QR"
          url={speakerUrl}
          variant="speaker"
        />
        <RouteActionCluster
          disabled={listenerPageEnabled === false}
          openLabel="Open listener page"
          qrDataUrl={listenerQrDataUrl}
          qrFileName={`${eventSlug}-${slug}-listener.png`}
          qrLabel={`${name} listener`}
          qrTriggerLabel="Show listener QR"
          url={listenerUrl}
          variant="listener"
        />
        {canDelete ? (
          <form action={deleteChannelAction} id={deleteFormId}>
            <input name="eventSlug" type="hidden" value={eventSlug} />
            <input name="id" type="hidden" value={channelId} />
            <input name="returnTo" type="hidden" value="list" />
            <ConfirmSubmitButton
              action={deleteChannelAction}
              className="rounded-2xl border px-3 py-2 text-sm font-medium"
              confirmMessage="Delete this channel? This removes its listener/speaker links and QR targets."
              formId={deleteFormId}
              title="Delete channel"
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>
    </li>
  )
}
