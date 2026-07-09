'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { bulkChannelsAction } from '@/app/events/[eventSlug]/channels/actions'
import {
  BulkActionSelect,
  ListBulkActionsPanel,
  useBulkSelection,
  useVisibleBulkKeys,
} from '@/components/ListBulkActionsPanel'
import { TruncatedList } from '@/components/TruncatedList'
import { channelEnabledChip } from '@/lib/active-status'
import { rowTintClass, type ListRowTint } from '@/lib/list-group-tints'

type ChannelListItem = {
  canDelete: boolean
  channelId: number
  description?: string | null
  enabled?: boolean | null
  eventSlug: string
  name: string
  rowTint?: ListRowTint
  slug: string
}

type ChannelsHubTableProps = {
  channels: ChannelListItem[]
  returnPath: string
}

function channelKey(channel: ChannelListItem): string {
  return `${channel.eventSlug}:${channel.channelId}`
}

export function ChannelsHubTable({ channels, returnPath }: ChannelsHubTableProps) {
  const router = useRouter()
  const { selectedCount, selectedKeys, toggleAll, toggleKey } = useBulkSelection<string>()
  const [bulkAction, setBulkAction] = useState('enable')

  const selectableItems = useMemo(
    () =>
      channels.map((channel) => ({
        key: channelKey(channel),
        selectable: bulkAction !== 'delete' || channel.canDelete,
      })),
    [bulkAction, channels],
  )
  const visibleKeys = useVisibleBulkKeys(selectableItems)
  const allVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every((key) => selectedKeys.has(key))
  const selectedChannels = channels.filter((channel) => selectedKeys.has(channelKey(channel)))

  return (
    <div className="space-y-4">
      <ListBulkActionsPanel
        description="Enable, disable, or delete multiple channels at once."
        selectedCount={selectedCount}
      >
        <form action={bulkChannelsAction} className="grid gap-3 xl:grid-cols-[260px_auto] xl:items-end">
          <input name="returnPath" type="hidden" value={returnPath} />
          <input name="bulkAction" type="hidden" value={bulkAction} />
          {selectedChannels.map((channel) => (
            <input
              key={channelKey(channel)}
              name="channelKeys"
              type="hidden"
              value={channelKey(channel)}
            />
          ))}

          <BulkActionSelect
            action={bulkAction}
            onActionChange={setBulkAction}
            options={[
              { label: 'Enable channels', value: 'enable' },
              { label: 'Disable channels', value: 'disable' },
              { label: 'Enable listener pages', value: 'enable-listener' },
              { label: 'Disable listener pages', value: 'disable-listener' },
              { label: 'Enable speaker pages', value: 'enable-speaker' },
              { label: 'Disable speaker pages', value: 'disable-speaker' },
              { label: 'Delete channels', value: 'delete' },
            ]}
          />

          <button
            className={`px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
              bulkAction === 'delete' ? 'us-button-secondary' : 'us-button-primary'
            }`}
            disabled={selectedCount === 0}
            type="submit"
          >
            Apply to {selectedCount} selected
          </button>
        </form>
      </ListBulkActionsPanel>

      <article className="us-panel px-4 py-4">
        <div className="us-data-row us-data-row-header us-data-row--cols-3 px-4" style={{ color: 'var(--us-muted)' }}>
          <span className="us-data-row__lead flex items-center gap-3">
            <input
              aria-label="Select all visible channels"
              checked={allVisibleSelected}
              onChange={() => toggleAll(visibleKeys)}
              type="checkbox"
            />
            <span>Channel</span>
          </span>
          <span className="us-data-row__chips">Status</span>
          <span className="us-data-row__actions">Actions</span>
        </div>

        {channels.length === 0 ? (
          <p className="px-2 py-4 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
            No channels are available.
          </p>
        ) : (
          <TruncatedList itemLabel="channels" listClassName="space-y-3">
            {channels.map((channel) => {
              const href = `/events/${channel.eventSlug}/channels/${channel.slug}`
              const key = channelKey(channel)
              const selectable = bulkAction !== 'delete' || channel.canDelete

              return (
                <div
                  className={`us-data-row us-data-row--cols-3 rounded-3xl border px-4 py-4 ${rowTintClass(channel.rowTint ?? 'white')}`}
                  key={key}
                  style={{ borderColor: 'var(--us-border)' }}
                >
                  <div className="us-data-row__lead flex items-start gap-3">
                    <input
                      aria-label={`Select ${channel.name}`}
                      checked={selectedKeys.has(key)}
                      disabled={!selectable}
                      onChange={() => toggleKey(key)}
                      type="checkbox"
                    />
                    <button
                      className="text-left"
                      onClick={() => router.push(href)}
                      type="button"
                    >
                      <span className="font-semibold hover:underline" style={{ color: 'var(--us-green-dark)' }}>
                        {channel.name}
                      </span>
                      {channel.description ? (
                        <p className="mt-1 line-clamp-2 text-sm leading-5" style={{ color: 'var(--us-muted)' }}>
                          {channel.description}
                        </p>
                      ) : null}
                    </button>
                  </div>

                  <div className="us-data-row__chips">
                    {(() => {
                      const statusChip = channelEnabledChip(channel.enabled)

                      return <span className={`us-chip ${statusChip.className}`}>{statusChip.label}</span>
                    })()}
                  </div>

                  <div className="us-data-row__actions flex flex-wrap gap-2">
                    <Link
                      className="us-button-secondary px-3 py-2 text-sm font-medium"
                      href={`/events/${channel.eventSlug}/share`}
                    >
                      Share
                    </Link>
                    <button
                      className="us-button-secondary px-3 py-2 text-sm font-medium"
                      onClick={() => router.push(href)}
                      type="button"
                    >
                      Open
                    </button>
                  </div>
                </div>
              )
            })}
          </TruncatedList>
        )}
      </article>
    </div>
  )
}
