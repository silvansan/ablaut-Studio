'use client'

import Link from '@/components/OrgLink'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { deleteChannelAction } from '@/app/events/[eventSlug]/channels/actions'
import { PencilIcon, TrashIcon } from '@/components/ActionIcons'
import { ChannelDrawer } from '@/components/ChannelDrawer'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { RouteActionCluster } from '@/components/RouteActionCluster'
import { channelEnabledChip } from '@/lib/active-status'
import type { Channel } from '@/payload-types'

export type ChannelRoute = {
  disabled?: boolean
  fileName?: string
  qrDataUrl?: string
  url: string
}

type ChannelRowProps = {
  canDelete?: boolean
  /** Full channel record; when present (and the viewer can manage), clicking the row edits it in a drawer. */
  channel?: Channel
  channelId: number
  description?: string | null
  enabled?: boolean | null
  eventListenerPasswordConfigured?: boolean
  eventSlug: string
  listenerRoute?: ChannelRoute
  name: string
  slug: string
  speakerRoute?: ChannelRoute
}

export function ChannelRow({
  canDelete = false,
  channel,
  channelId,
  description,
  enabled,
  eventListenerPasswordConfigured = false,
  eventSlug,
  listenerRoute,
  name,
  slug,
  speakerRoute,
}: ChannelRowProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const href = `/events/${eventSlug}/channels/${slug}`
  const deleteFormId = `delete-channel-${channelId}`
  const statusChip = channelEnabledChip(enabled)
  const canEdit = Boolean(channel)

  function activateRow() {
    if (canEdit) {
      setEditing(true)
    } else {
      router.push(href)
    }
  }

  return (
    <li
      className="us-data-row us-data-row--cols-3 us-list-row cursor-pointer px-3 py-3"
      onClick={activateRow}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          activateRow()
        }
      }}
      role={canEdit ? 'button' : 'link'}
      tabIndex={0}
    >
      <div className="us-data-row__lead">
        <span className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          {name}
        </span>
        {description ? (
          <p className="mt-0.5 line-clamp-1 text-sm leading-5" style={{ color: 'var(--us-muted)' }}>
            {description}
          </p>
        ) : null}
      </div>

      <div className="us-data-row__chips">
        <span className={`us-chip ${statusChip.className}`}>{statusChip.label}</span>
      </div>

      <div className="us-data-row__actions" onClick={(event) => event.stopPropagation()}>
        {/* Blue = listener, green = speaker: scan or open straight from the row. */}
        {listenerRoute ? (
          <RouteActionCluster
            disabled={listenerRoute.disabled}
            openLabel={`Open ${name} listener page`}
            qrDataUrl={listenerRoute.qrDataUrl}
            qrFileName={listenerRoute.fileName}
            qrLabel="Listener"
            qrTriggerLabel={`Show ${name} listener QR`}
            url={listenerRoute.url}
            variant="listener"
          />
        ) : null}
        {speakerRoute ? (
          <RouteActionCluster
            disabled={speakerRoute.disabled}
            openLabel={`Open ${name} speaker page`}
            qrDataUrl={speakerRoute.qrDataUrl}
            qrFileName={speakerRoute.fileName}
            qrLabel="Speaker"
            qrTriggerLabel={`Show ${name} speaker QR`}
            url={speakerRoute.url}
            variant="speaker"
          />
        ) : null}
        {canEdit ? (
          <button
            aria-label={`Edit ${name}`}
            className="us-button-secondary inline-flex h-8 w-8 items-center justify-center"
            onClick={() => setEditing(true)}
            title="Edit"
            type="button"
          >
            <PencilIcon />
          </button>
        ) : null}
        {/* Editors use the drawer; only read-only viewers, who have none, get a link to the channel page. */}
        {canEdit ? null : (
          <Link className="us-button-secondary px-3 py-1.5 text-sm font-medium" href={href}>
            Open
          </Link>
        )}
        {canDelete ? (
          <form action={deleteChannelAction} id={deleteFormId}>
            <input name="eventSlug" type="hidden" value={eventSlug} />
            <input name="id" type="hidden" value={channelId} />
            <input name="returnTo" type="hidden" value="list" />
            <ConfirmSubmitButton
              action={deleteChannelAction}
              className="us-button-secondary inline-flex h-8 w-8 items-center justify-center"
              confirmLabel="Delete"
              confirmMessage="Delete this channel? This removes its listener/speaker links and QR targets."
              formId={deleteFormId}
              title="Delete channel"
              triggerLabel={`Delete ${name}`}
            >
              <TrashIcon />
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>

      {channel ? (
        <ChannelDrawer
          channel={channel}
          eventListenerPasswordConfigured={eventListenerPasswordConfigured}
          eventSlug={eventSlug}
          onClose={() => setEditing(false)}
          open={editing}
        />
      ) : null}
    </li>
  )
}
