import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { canDeleteEvent, createEventAction } from '@/app/events/actions'
import { DashboardActionCards } from '@/components/DashboardActionCards'
import { EventForm } from '@/components/EventForm'
import { EventsHubTable } from '@/components/EventsHubTable'
import { Layout } from '@/components/Layout'
import { DrawerTrigger } from '@/components/DrawerTrigger'
import { FilterTabs, ListEmpty, ListPanel } from '@/components/ListKit'
import { PageHeader } from '@/components/PageHeader'
import { PendingJoinRequestsPanel } from '@/components/PendingJoinRequestsPanel'
import { getDashboardActionItems, getDashboardEvents } from '@/lib/dashboard-data'
import { getManageableOrganizations } from '@/lib/organization-data'
import { hasOrganizationManagementAccess } from '@/lib/organizations'
import { requireAppUser } from '@/lib/app-auth'
import { pageMetadata } from '@/lib/branding'
import { canCreateEvents } from '@/lib/permissions'
import { getPendingJoinRequestsForHub } from '@/lib/users-hub-data'
export const metadata: Metadata = pageMetadata('Events')

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ status?: string }>
}

export default async function EventsPage({ searchParams }: PageProps) {
  const { status } = await searchParams
  const [events, user, organizations, actionItems, pendingJoinRequests] = await Promise.all([
    getDashboardEvents(),
    requireAppUser(),
    getManageableOrganizations(),
    getDashboardActionItems(),
    getPendingJoinRequestsForHub(),
  ])
  const payload = await getPayload({ config: configPromise })
  const visibleEvents =
    status === 'active' || status === 'draft' || status === 'archived'
      ? events.filter((event) => event.status === status)
      : events
  const [canCreateEventsUser, canManageUsers] = await Promise.all([
    canCreateEvents({ payload, user } as never),
    hasOrganizationManagementAccess({ payload, user } as never),
  ])

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
  const returnPath = status ? `/events?status=${status}` : '/events'

  return (
    <Layout hideHeader title="Events">
      <section className="space-y-4">
        <PageHeader
          actions={
            canCreateEventsUser ? (
              <DrawerTrigger buttonLabel="New event">
                <EventForm
                  action={createEventAction}
                  organizations={organizations}
                  submitLabel="Create event"
                  variant="drawer"
                />
              </DrawerTrigger>
            ) : null
          }
          title="Events"
        />
        <DashboardActionCards actionItems={actionItems} canManageUsers={canManageUsers} />
        <PendingJoinRequestsPanel memberships={pendingJoinRequests} returnPath="/events" />

        <FilterTabs
          items={[
            { active: !status, href: '/events', label: 'All' },
            { active: status === 'active', href: '/events?status=active', label: 'Active' },
            { active: status === 'draft', href: '/events?status=draft', label: 'Draft' },
            { active: status === 'archived', href: '/events?status=archived', label: 'Archived' },
          ]}
          label="Filter events"
        />

        {eventsWithDelete.length > 0 ? (
          <EventsHubTable
            events={eventsWithDelete.map((event) => ({
              canDelete: event.canDelete,
              channelCount: event.channelCount,
              dateStart: event.dateStart,
              description: event.description,
              eventId: event.id,
              location: event.location,
              organizationTitle: event.organizationTitle,
              slug: event.slug,
              status: event.status ?? 'active',
              title: event.title,
            }))}
            returnPath={returnPath}
            showOrganization={organizations.length > 1}
          />
        ) : (
          <ListPanel>
            <ListEmpty>
              {canCreateEventsUser
                ? organizations.length === 0
                  ? 'No events yet. Join an organization first, then create your first event.'
                  : 'No events yet. Use New event to add your first.'
                : 'No events are available for your account yet.'}
            </ListEmpty>
          </ListPanel>
        )}
      </section>
    </Layout>
  )
}
