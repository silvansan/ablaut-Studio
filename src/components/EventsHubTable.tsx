'use client'

import { useMemo, useState } from 'react'

import { bulkEventsAction } from '@/app/events/actions'
import {
  BulkActionSelect,
  ListBulkActionsPanel,
  useBulkSelection,
  useVisibleBulkKeys,
} from '@/components/ListBulkActionsPanel'
import { ChannelsIcon } from '@/components/ActionIcons'
import { Chip, ChipGrid, ListBody, ListPanel, ListRow, OpenIconButton, RowTitle } from '@/components/ListKit'
import { eventStatusChip } from '@/lib/active-status'

type EventListItem = {
  canDelete: boolean
  channelCount: number
  dateStart?: string | null
  description?: string | null
  eventId: number
  location?: string | null
  organizationTitle?: string | null
  slug: string
  status?: string | null
  title: string
}

type EventsHubTableProps = {
  events: EventListItem[]
  returnPath: string
  /** Show the organization under each event; only useful when the list spans several. */
  showOrganization?: boolean
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

export function EventsHubTable({ events, returnPath, showOrganization = false }: EventsHubTableProps) {
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
        <form action={bulkEventsAction} className="flex w-max items-center gap-2">
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
            <label className="flex items-center">
              <span className="sr-only">Status</span>
              <select
                className="us-input us-input--inline"
                onChange={(event) => setBulkStatus(event.target.value)}
                value={bulkStatus}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </label>
          ) : (
            <div className="text-xs" style={{ color: 'var(--us-muted)' }}>
              {canDeleteAnySelected
                ? 'Deletes channels and event assignments for each selected event.'
                : 'Only events you can delete are selectable for this action.'}
            </div>
          )}

          <button
            className={`px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
              bulkAction === 'delete' ? 'us-button-secondary' : 'us-button-primary'
            }`}
            disabled={selectedCount === 0 || (bulkAction === 'delete' && !canDeleteAnySelected)}
            type="submit"
          >
            Apply to {selectedCount} selected
          </button>
        </form>
      </ListBulkActionsPanel>

      <ListPanel
        leading={
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--us-muted)' }}>
            <input
              aria-label="Select all visible events"
              checked={allVisibleSelected}
              onChange={() => toggleAll(visibleKeys)}
              type="checkbox"
            />
            Select all
          </label>
        }
      >
        <ListBody itemLabel="events">
          {events.map((event) => {
            const statusChip = eventStatusChip(event.status)
            const selectable = bulkAction !== 'delete' || event.canDelete
            const subtitle = showOrganization ? event.organizationTitle : event.description

            return (
              <ListRow
                actions={<OpenIconButton href={`/events/${event.slug}`} label={`Open ${event.title}`} />}
                chips={
                  <ChipGrid columns="5.5rem 6.5rem">
                    <Chip className={statusChip.className} dot>
                      {statusChip.label}
                    </Chip>
                    <Chip icon={<ChannelsIcon />} title="Channels" tone="blue">
                      {event.channelCount} {event.channelCount === 1 ? 'channel' : 'channels'}
                    </Chip>
                  </ChipGrid>
                }
                detail={event.location || formatDate(event.dateStart) || 'No date'}
                href={`/events/${event.slug}`}
                key={event.slug}
                lead={<RowTitle subtitle={subtitle} title={event.title} />}
                selection={{
                  checked: selectedKeys.has(event.eventId),
                  disabled: !selectable,
                  label: `Select ${event.title}`,
                  onChange: () => toggleKey(event.eventId),
                }}
              />
            )
          })}
        </ListBody>
      </ListPanel>
    </div>
  )
}
