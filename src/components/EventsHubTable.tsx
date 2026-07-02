'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { bulkEventsAction } from '@/app/events/actions'
import {
  BulkActionSelect,
  ListBulkActionsPanel,
  useBulkSelection,
  useVisibleBulkKeys,
} from '@/components/ListBulkActionsPanel'
import { TruncatedList } from '@/components/TruncatedList'
import { rowTintClass, type ListRowTint } from '@/lib/list-group-tints'
import { eventStatusChip } from '@/lib/active-status'

type EventListItem = {
  canDelete: boolean
  channelCount: number
  dateStart?: string | null
  description?: string | null
  eventId: number
  location?: string | null
  organizationTitle?: string | null
  rowTint?: ListRowTint
  slug: string
  status?: string | null
  title: string
}

type EventsHubTableProps = {
  events: EventListItem[]
  returnPath: string
}

function formatDate(value?: string | null): string | null {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function EventsHubTable({ events, returnPath }: EventsHubTableProps) {
  const router = useRouter()
  const { selectedCount, selectedKeys, toggleAll, toggleKey } = useBulkSelection<number>()
  const [bulkAction, setBulkAction] = useState('set-status')
  const [bulkStatus, setBulkStatus] = useState('active')

  const selectableItems = useMemo(
    () =>
      events.map((event) => ({
        key: event.eventId,
        selectable: bulkAction !== 'delete' || event.canDelete,
      })),
    [bulkAction, events],
  )
  const visibleKeys = useVisibleBulkKeys(selectableItems)
  const allVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every((key) => selectedKeys.has(key))
  const selectedEvents = events.filter((event) => selectedKeys.has(event.eventId))
  const canDeleteAnySelected = selectedEvents.some((event) => event.canDelete)

  return (
    <div className="space-y-4">
      <ListBulkActionsPanel
        description="Update status or delete multiple events at once."
        selectedCount={selectedCount}
      >
        <form action={bulkEventsAction} className="grid gap-3 xl:grid-cols-[220px_220px_auto] xl:items-end">
          <input name="returnPath" type="hidden" value={returnPath} />
          <input name="bulkAction" type="hidden" value={bulkAction} />
          <input name="bulkStatus" type="hidden" value={bulkStatus} />
          {selectedEvents.map((event) => (
            <input key={event.eventId} name="eventIDs" type="hidden" value={event.eventId} />
          ))}

          <BulkActionSelect
            action={bulkAction}
            onActionChange={setBulkAction}
            options={[
              { label: 'Set status', value: 'set-status' },
              { label: 'Delete events', value: 'delete' },
            ]}
          />

          {bulkAction === 'set-status' ? (
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Status
              <select
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                onChange={(event) => setBulkStatus(event.target.value)}
                style={{ borderColor: 'var(--us-border)' }}
                value={bulkStatus}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          ) : (
            <div className="flex items-end text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
              {canDeleteAnySelected
                ? 'Deletes channels and event assignments for each selected event.'
                : 'Only events you can delete are selectable for this action.'}
            </div>
          )}

          <button
            className={`px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
              bulkAction === 'delete' ? 'us-button-secondary' : 'us-button-primary'
            }`}
            disabled={selectedCount === 0 || (bulkAction === 'delete' && !canDeleteAnySelected)}
            type="submit"
          >
            Apply to {selectedCount} selected
          </button>
        </form>
      </ListBulkActionsPanel>

      <div className="us-panel overflow-hidden px-4 py-4">
        <div className="us-data-row us-data-row-header us-data-row--cols-4 px-4" style={{ color: 'var(--us-muted)' }}>
          <span className="us-data-row__lead flex items-center gap-3">
            <input
              aria-label="Select all visible events"
              checked={allVisibleSelected}
              onChange={() => toggleAll(visibleKeys)}
              type="checkbox"
            />
            <span>Event</span>
          </span>
          <span className="us-data-row__chips">Status</span>
          <span className="us-data-row__detail">When / where</span>
          <span className="us-data-row__actions">Open</span>
        </div>
        <TruncatedList as="ul" itemLabel="events" listClassName="space-y-2">
          {events.map((event) => {
            const formattedDate = formatDate(event.dateStart)
            const href = `/events/${event.slug}`
            const selectable = bulkAction !== 'delete' || event.canDelete

            return (
              <li
                key={event.slug}
                className={`us-data-row us-data-row--cols-4 cursor-pointer rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md ${rowTintClass(event.rowTint ?? 'white')}`}
                onClick={() => router.push(href)}
                onKeyDown={(keyboardEvent) => {
                  if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                    keyboardEvent.preventDefault()
                    router.push(href)
                  }
                }}
                role="link"
                style={{ borderColor: 'var(--us-border)' }}
                tabIndex={0}
              >
                <div className="us-data-row__lead flex items-start gap-3">
                  <input
                    aria-label={`Select ${event.title}`}
                    checked={selectedKeys.has(event.eventId)}
                    disabled={!selectable}
                    onChange={() => toggleKey(event.eventId)}
                    onClick={(clickEvent) => clickEvent.stopPropagation()}
                    type="checkbox"
                  />
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                      {event.title}
                    </span>
                    {event.description ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-5" style={{ color: 'var(--us-muted)' }}>
                        {event.description}
                      </p>
                    ) : null}
                    {event.organizationTitle ? (
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em]" style={{ color: 'var(--us-blue-dark)' }}>
                        {event.organizationTitle}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="us-data-row__chips">
                  {(() => {
                    const statusChip = eventStatusChip(event.status)

                    return <span className={`us-chip ${statusChip.className}`}>{statusChip.label}</span>
                  })()}
                  <span className="us-chip us-chip-blue">
                    {event.channelCount} {event.channelCount === 1 ? 'channel' : 'channels'}
                  </span>
                </div>

                <div className="us-data-row__detail text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
                  {event.location || formattedDate || 'No date'}
                </div>

                <div className="us-data-row__actions">
                  <span className="text-sm font-medium" style={{ color: 'var(--us-blue-dark)' }}>
                    Open
                  </span>
                </div>
              </li>
            )
          })}
        </TruncatedList>
      </div>
    </div>
  )
}
