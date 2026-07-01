import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'

import { canDeleteEvent, createEventAction } from '@/app/events/actions'
import { EventForm } from '@/components/EventForm'
import { EventRow } from '@/components/EventRow'
import { PanelDrawer } from '@/components/PanelDrawer'
import { TruncatedList } from '@/components/TruncatedList'
import { requireAppUser } from '@/lib/app-auth'
import { getDashboardEventsForOrganization } from '@/lib/dashboard-data'
import { assignGroupTints } from '@/lib/list-group-tints'
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

  const sortedEvents = [...visibleEvents].sort((a, b) => a.title.localeCompare(b.title))
  const eventsWithDelete = await Promise.all(
    sortedEvents.map(async (event) => ({
      ...event,
      canDelete: await canDeleteEvent(payload, user, event),
    })),
  )
  const tintedEvents = assignGroupTints(eventsWithDelete, () => organization.slug)

  const tabBase = `/organizations/${organization.slug}?tab=events`

  return (
    <div className="space-y-4">
      <div className="us-panel flex flex-wrap items-center gap-2 px-6 py-5">
        {[
          ['All', tabBase],
          ['Active', `${tabBase}&status=active`],
          ['Draft', `${tabBase}&status=draft`],
          ['Archived', `${tabBase}&status=archived`],
        ].map(([label, href]) => {
          const active =
            (label === 'All' && !status) ||
            (label === 'Active' && status === 'active') ||
            (label === 'Draft' && status === 'draft') ||
            (label === 'Archived' && status === 'archived')

          return (
            <Link
              key={label}
              className="rounded-2xl border px-4 py-2 text-sm font-medium"
              href={href}
              style={{
                backgroundColor: active ? 'var(--us-green-dark)' : 'white',
                borderColor: active ? 'var(--us-green-dark)' : 'var(--us-border)',
                color: active ? 'white' : 'var(--us-text)',
              }}
            >
              {label}
            </Link>
          )
        })}
        {canCreateEventsUser ? (
          <div className="ml-auto">
            <PanelDrawer description="Create an event in this organization." title="Create event">
              <EventForm action={createEventAction} organizationId={organization.id} submitLabel="Create event" variant="drawer" />
            </PanelDrawer>
          </div>
        ) : null}
      </div>

      {tintedEvents.length > 0 ? (
        <div className="us-panel overflow-hidden px-4 py-4">
          <div className="us-data-row us-data-row-header us-data-row--cols-4 px-4" style={{ color: 'var(--us-muted)' }}>
            <span className="us-data-row__lead">Event</span>
            <span className="us-data-row__chips">Status</span>
            <span className="us-data-row__detail">When / where</span>
            <span className="us-data-row__actions">{tintedEvents.some((event) => event.canDelete) ? 'Delete' : ''}</span>
          </div>
          <TruncatedList as="ul" itemLabel="events" listClassName="space-y-2">
            {tintedEvents.map((event) => (
              <EventRow
                canDelete={event.canDelete}
                channelCount={event.channelCount}
                dateStart={event.dateStart}
                description={event.description}
                eventId={event.id}
                key={event.slug}
                location={event.location}
                rowTint={event.rowTint}
                slug={event.slug}
                status={event.status ?? 'draft'}
                title={event.title}
              />
            ))}
          </TruncatedList>
        </div>
      ) : (
        <div className="us-panel px-6 py-6">
          <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            No events in this organization yet.
          </p>
          {canCreateEventsUser ? (
            <div className="mt-4">
              <PanelDrawer description="Create an event in this organization." title="Create event">
                <EventForm action={createEventAction} organizationId={organization.id} submitLabel="Create event" variant="drawer" />
              </PanelDrawer>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
