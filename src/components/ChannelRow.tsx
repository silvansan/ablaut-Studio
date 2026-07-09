'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { deleteChannelAction } from '@/app/events/[eventSlug]/channels/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { channelEnabledChip } from '@/lib/active-status'
import { rowTintClass, type ListRowTint } from '@/lib/list-group-tints'

type ChannelRowProps = {
  canDelete?: boolean
  channelId: number
  description?: string | null
  enabled?: boolean | null
  eventSlug: string
  name: string
  rowTint?: ListRowTint
  slug: string
}

export function ChannelRow({
  canDelete = false,
  channelId,
  description,
  enabled,
  eventSlug,
  name,
  rowTint = 'white',
  slug,
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
        <Link className="us-button-secondary px-3 py-2 text-sm font-medium" href={`/events/${eventSlug}/channels/${slug}`}>
          Open
        </Link>
        <Link className="us-button-secondary px-3 py-2 text-sm font-medium" href={`/events/${eventSlug}/share`}>
          Share
        </Link>
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
