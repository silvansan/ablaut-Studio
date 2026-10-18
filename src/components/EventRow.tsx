import { deleteEventAction } from '@/app/events/actions'
import { ChannelsIcon } from '@/components/ActionIcons'
import { Chip, ChipGrid, DeleteIconButton, ListRow, OpenIconButton, RowTitle } from '@/components/ListKit'
import { eventStatusChip } from '@/lib/active-status'

type EventRowProps = {
  canDelete?: boolean
  channelCount: number
  dateStart?: string | null
  description?: string | null
  eventId: number
  location?: string | null
  slug: string
  status?: string | null
  title: string
}

function formatDate(value?: string | null): string | null {
  if (!value) {
    return null
  }

  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export function EventRow({
  canDelete = false,
  channelCount,
  dateStart,
  description,
  eventId,
  location,
  slug,
  status,
  title,
}: EventRowProps) {
  const href = `/events/${slug}`
  const statusChip = eventStatusChip(status)

  return (
    <ListRow
      actions={
        <>
          {canDelete ? (
            <DeleteIconButton
              action={deleteEventAction}
              confirmMessage="Delete this event? This also removes its channels and event assignments."
              fields={{ id: eventId, returnTo: 'list' }}
              label={`Delete ${title}`}
              title="Delete event"
            />
          ) : null}
          <OpenIconButton href={href} label={`Open ${title}`} />
        </>
      }
      chips={
        <ChipGrid columns="5.5rem 6.5rem">
          <Chip className={statusChip.className} dot>
            {statusChip.label}
          </Chip>
          <Chip icon={<ChannelsIcon />} title="Channels" tone="blue">
            {channelCount} {channelCount === 1 ? 'channel' : 'channels'}
          </Chip>
        </ChipGrid>
      }
      detail={location || formatDate(dateStart) || 'No date'}
      href={href}
      lead={<RowTitle subtitle={description} title={title} />}
    />
  )
}
