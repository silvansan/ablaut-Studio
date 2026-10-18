import { deleteOrganizationAction } from '@/app/organizations/actions'
import { CalendarIcon, UserCircleIcon } from '@/components/ActionIcons'
import { Chip, ChipGrid, DeleteIconButton, ListRow, OpenIconButton, RowTitle } from '@/components/ListKit'

type OrganizationRowProps = {
  canDelete?: boolean
  eventCount: number
  memberCount: number
  name: string
  organizationId: number
  slug: string
}

export function OrganizationRow({ canDelete = false, eventCount, memberCount, name, organizationId, slug }: OrganizationRowProps) {
  const href = `/organizations/${slug}`

  return (
    <ListRow
      actions={
        <>
          {canDelete ? (
            <DeleteIconButton
              action={deleteOrganizationAction}
              confirmMessage="Delete this organization? This cannot be undone."
              fields={{ organizationId }}
              label={`Delete ${name}`}
              title="Delete organization"
            />
          ) : null}
          <OpenIconButton href={href} label={`Open ${name}`} />
        </>
      }
      chips={
        <ChipGrid columns="6rem 7rem">
          <Chip icon={<CalendarIcon />} title="Events" tone="blue">
            {eventCount} {eventCount === 1 ? 'event' : 'events'}
          </Chip>
          <Chip icon={<UserCircleIcon />} title="Members" tone="muted">
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </Chip>
        </ChipGrid>
      }
      href={href}
      lead={<RowTitle subtitle={slug} title={name} />}
    />
  )
}
