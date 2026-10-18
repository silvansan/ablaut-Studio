'use client'

import { useState } from 'react'

import { deleteChannelAction } from '@/app/events/[eventSlug]/channels/actions'
import { ChannelDrawer } from '@/components/ChannelDrawer'
import { Chip, DeleteIconButton, EditIconButton, ListRow, OpenIconButton, RowTitle } from '@/components/ListKit'
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
  /** Full channel record; when present (and the viewer can manage), the row edits it in a drawer. */
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
  const [editing, setEditing] = useState(false)
  const href = `/events/${eventSlug}/channels/${slug}`
  const statusChip = channelEnabledChip(enabled)
  const canEdit = Boolean(channel)

  return (
    <>
      <ListRow
        actions={
          <>
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
              <EditIconButton label={`Edit ${name}`} onClick={() => setEditing(true)} />
            ) : (
              <OpenIconButton href={href} label={`Open ${name}`} />
            )}
            {canDelete ? (
              <DeleteIconButton
                action={deleteChannelAction}
                confirmMessage="Delete this channel? This removes its listener/speaker links and QR targets."
                fields={{ eventSlug, id: channelId, returnTo: 'list' }}
                label={`Delete ${name}`}
                title="Delete channel"
              />
            ) : null}
          </>
        }
        chips={
          <Chip className={statusChip.className} dot>
            {statusChip.label}
          </Chip>
        }
        href={canEdit ? undefined : href}
        lead={<RowTitle subtitle={description} title={name} />}
        onActivate={canEdit ? () => setEditing(true) : undefined}
      />
      {channel ? (
        <ChannelDrawer
          channel={channel}
          eventListenerPasswordConfigured={eventListenerPasswordConfigured}
          eventSlug={eventSlug}
          onClose={() => setEditing(false)}
          open={editing}
        />
      ) : null}
    </>
  )
}
