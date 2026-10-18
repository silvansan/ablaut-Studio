import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canDeleteEvent, createEventAction } from '@/app/events/actions'
import { DrawerTrigger } from '@/components/DrawerTrigger'
import { EventForm } from '@/components/EventForm'
import { EventRow } from '@/components/EventRow'
import { FilterTabs, ListBody, ListEmpty, ListPanel } from '@/components/ListKit'
import { requireAppUser } from '@/lib/app-auth'
import { getDashboardEventsForOrganization } from '@/lib/dashboard-data'
import { canCreateEvents } from '@/lib/permissions'
import type { Organization } from '@/payload-types'

type OrganizationEventsPanelProps = {
  organization: Organization
  status?: string
}

export async function OrganizationEventsPanel({ organization, status }: OrganizationEventsPanelProps) {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const events = await getDashboardEventsForOrganization(organization.id, 500)
  const visibleEvents =
    status === 'active' || status === 'draft' || status === 'archived'
      ? events.filter((event) => event.status === status)
      : events
  const canCreateEventsUser = await canCreateEvents({ payload, user } as never)

  const eventsWithDelete = await Promise.all(
    [...visibleEvents]
      .sort((a, b) => a.title.localeCompare(b.title))
      .map(async (event) => ({ ...event, canDelete: await canDeleteEvent(payload, user, event) })),
  )

  const tabBase = `/organizations/${organization.slug}?tab=events`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <FilterTabs
            items={[
              { active: !status, href: tabBase, label: 'All' },
              { active: status === 'active', href: `${tabBase}&status=active`, label: 'Active' },
              { active: status === 'draft', href: `${tabBase}&status=draft`, label: 'Draft' },
              { active: status === 'archived', href: `${tabBase}&status=archived`, label: 'Archived' },
            ]}
            label="Filter events"
          />
        </div>
        {canCreateEventsUser ? (
          <DrawerTrigger buttonLabel="New event">
            <EventForm action={createEventAction} organizationId={organization.id} submitLabel="Create event" variant="drawer" />
          </DrawerTrigger>
        ) : null}
      </div>

      <ListPanel>
        {eventsWithDelete.length > 0 ? (
          <ListBody itemLabel="events">
            {eventsWithDelete.map((event) => (
              <EventRow
                canDelete={event.canDelete}
                channelCount={event.channelCount}
                dateStart={event.dateStart}
                description={event.description}
                eventId={event.id}
                key={event.slug}
                location={event.location}
                slug={event.slug}
                status={event.status ?? 'draft'}
                title={event.title}
              />
            ))}
          </ListBody>
        ) : (
          <ListEmpty>No events in this organization yet.</ListEmpty>
        )}
      </ListPanel>
    </div>
  )
}
