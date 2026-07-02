'use client'

import { useRouter } from 'next/navigation'

import { deleteEventAction } from '@/app/events/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { eventStatusChip } from '@/lib/active-status'
import { rowTintClass, type ListRowTint } from '@/lib/list-group-tints'

type EventRowProps = {
  canDelete?: boolean
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

function formatDate(value?: string | null): string | null {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function EventRow({
  canDelete = false,
  channelCount,
  dateStart,
  description,
  eventId,
  location,
  organizationTitle,
  rowTint = 'white',
  slug,
  status,
  title,
}: EventRowProps) {
  const formattedDate = formatDate(dateStart)
  const router = useRouter()
  const href = `/events/${slug}`
  const deleteFormId = `delete-event-${eventId}`
  const statusChip = eventStatusChip(status)

  function openRow() {
    router.push(href)
  }

  return (
    <li
      className={`us-data-row us-data-row--cols-4 cursor-pointer rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md ${rowTintClass(rowTint)}`}
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
          {title}
        </span>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-5" style={{ color: 'var(--us-muted)' }}>
            {description}
          </p>
        ) : null}
        {organizationTitle ? (
          <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em]" style={{ color: 'var(--us-blue-dark)' }}>
            {organizationTitle}
          </p>
        ) : null}
      </div>

      <div className="us-data-row__chips">
        <span className={`us-chip ${statusChip.className}`}>{statusChip.label}</span>
        <span className="us-chip us-chip-blue">
          {channelCount} {channelCount === 1 ? 'channel' : 'channels'}
        </span>
      </div>

      <div className="us-data-row__detail text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
        {location || formattedDate || 'No date'}
      </div>

      <div className="us-data-row__actions" onClick={(event) => event.stopPropagation()}>
        {canDelete ? (
          <form action={deleteEventAction} id={deleteFormId}>
            <input name="id" type="hidden" value={eventId} />
            <input name="returnTo" type="hidden" value="list" />
            <ConfirmSubmitButton
              action={deleteEventAction}
              className="rounded-2xl border px-3 py-2.5 text-sm font-medium"
              confirmMessage="Delete this event? This also removes its channels and event assignments."
              formId={deleteFormId}
              title="Delete event"
            >
              Delete
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>
    </li>
  )
}
