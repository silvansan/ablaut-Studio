import type { Metadata } from 'next'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'

import { canDeleteEvent, createEventAction } from '@/app/events/actions'
import { EventForm } from '@/components/EventForm'
import { EventRow } from '@/components/EventRow'
import { Layout } from '@/components/Layout'
import { PanelDrawer } from '@/components/PanelDrawer'
import { TruncatedList } from '@/components/TruncatedList'
import { getDashboardEvents } from '@/lib/dashboard-data'
import { assignGroupTints } from '@/lib/list-group-tints'
import { getManageableOrganizations } from '@/lib/organization-data'
import { requireAppUser } from '@/lib/app-auth'
import { pageMetadata } from '@/lib/branding'
import { canCreateEvents } from '@/lib/permissions'
export const metadata: Metadata = pageMetadata('Events')

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ status?: string }>
}

export default async function EventsPage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const [events, user, organizations] = await Promise.all([
    getDashboardEvents(),
    requireAppUser(),
    getManageableOrganizations(),
  ])
  const payload = await getPayload({ config: configPromise })
  const visibleEvents =
    status === 'active' || status === 'draft' || status === 'archived'
      ? events.filter((event) => event.status === status)
      : events
  const canCreateEventsUser = await canCreateEvents({ payload, user } as never)

  const sortedEvents = [...visibleEvents].sort((a, b) => {
    const orgCompare = (a.organizationTitle ?? '').localeCompare(b.organizationTitle ?? '')

    if (orgCompare !== 0) {
      return orgCompare
    }

    return a.title.localeCompare(b.title)
  })

  const eventsWithDelete = await Promise.all(
    sortedEvents.map(async (event) => ({
      ...event,
      canDelete: await canDeleteEvent(payload, user, event),
    })),
  )
  const tintedEvents = assignGroupTints(eventsWithDelete, (event) => String(event.organizationId ?? '__none__'))

  return (
    <Layout hideHeader title="Events">
      <section className="space-y-4">
        <div className="us-panel flex flex-wrap items-center gap-2 px-6 py-5">
          {[
            ['All', '/events'],
            ['Active', '/events?status=active'],
            ['Draft', '/events?status=draft'],
            ['Archived', '/events?status=archived'],
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
              <PanelDrawer description="Choose an organization and create a new event." title="Create event">
                <EventForm
                  action={createEventAction}
                  organizations={organizations}
                  submitLabel="Create event"
                  variant="drawer"
                />
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
                  organizationTitle={event.organizationTitle}
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
              {canCreateEventsUser
                ? organizations.length === 0
                  ? 'No events yet. Join an organization under Settings, then create your first event.'
                  : 'No events yet. Create one to get started.'
                : 'No events are available for your account yet.'}
            </p>
            {organizations.length === 0 && canCreateEventsUser ? (
              <Link className="us-button-primary mt-4 inline-flex px-4 py-2.5 text-sm font-medium" href="/settings">
                Open settings
              </Link>
            ) : canCreateEventsUser ? (
              <PanelDrawer description="Choose an organization and create a new event." title="Create event">
                <EventForm
                  action={createEventAction}
                  organizations={organizations}
                  submitLabel="Create event"
                  variant="drawer"
                />
              </PanelDrawer>
            ) : null}
          </div>
        )}
      </section>
    </Layout>
  )
}
