import { notFound } from 'next/navigation'

import { EventAssignmentsSection } from '@/components/EventAssignmentsSection'
import { EventWorkspaceHeader } from '@/components/EventWorkspaceHeader'
import { Layout } from '@/components/Layout'
import { getAssignableUsersForEvent, loadEventWorkspace } from '@/lib/event-workspace'
import { isSuperAdminUser } from '@/lib/permissions'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

export default async function EventPeopleTab({ params }: PageProps) {
  const { eventSlug } = await params
  const { canManageAssignments, event, payload, user } = await loadEventWorkspace(eventSlug)

  if (!canManageAssignments) {
    notFound()
  }

  const [assignments, assignableUsers] = await Promise.all([
    payload.find({
      collection: 'event-assignments',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      sort: 'roleForEvent',
      user,
      where: { event: { equals: event.id } },
    }),
    getAssignableUsersForEvent(payload, user, event.organizationId),
  ])

  return (
    <Layout
      breadcrumbs={[{ href: `/events/${eventSlug}`, label: event.title }, { label: 'People' }]}
      hideHeader
      title={`People · ${event.title}`}
    >
      <section className="space-y-4">
        <EventWorkspaceHeader canManage event={event} eventSlug={eventSlug} />
        <EventAssignmentsSection
            assignableUsers={assignableUsers}
            assignments={assignments.docs}
            canManageAssignments={canManageAssignments}
            canSetAdminRole={isSuperAdminUser(user)}
            eventID={event.id}
            eventSlug={event.slug}
          />
      </section>
    </Layout>
  )
}
