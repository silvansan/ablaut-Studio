import Link from 'next/link'
import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { DashboardActionCards } from '@/components/DashboardActionCards'
import { Layout } from '@/components/Layout'
import { ListGroupRow } from '@/components/ListGroupRow'
import { PendingJoinRequestsPanel } from '@/components/PendingJoinRequestsPanel'
import { requireAppUser } from '@/lib/app-auth'
import { getDashboardActionItems, getDashboardSummary } from '@/lib/dashboard-data'
import { assignGroupTints } from '@/lib/list-group-tints'
import { hasOrganizationManagementAccess } from '@/lib/organizations'
import { canCreateEvents } from '@/lib/permissions'
import { pageMetadata } from '@/lib/branding'
import { getPendingJoinRequestsForHub } from '@/lib/users-hub-data'

export const metadata: Metadata = pageMetadata('Dashboard')

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const [summary, actionItems, canCreateEventsUser, canManageUsers, pendingJoinRequests] = await Promise.all([
    getDashboardSummary(),
    getDashboardActionItems(),
    canCreateEvents({ payload, user } as never),
    hasOrganizationManagementAccess({ payload, user } as never),
    getPendingJoinRequestsForHub(),
  ])
  const channelItems = summary.recentChannels.slice(0, 4).map((channel) => ({
    eventSlug: channel.eventSlug,
    groupKey: `channel:${channel.eventSlug}`,
    href: `/events/${channel.eventSlug}/channels/${channel.slug}`,
    key: `channel-${channel.eventSlug}-${channel.slug}`,
    kind: 'channel' as const,
    label: `${channel.eventTitle} · ${channel.name}`,
  }))
  const eventItems = summary.recentEvents.slice(0, 4).map((event) => ({
    eventSlug: event.slug,
    groupKey: `event:${event.slug}`,
    href: `/events/${event.slug}`,
    key: `event-${event.slug}`,
    kind: 'event' as const,
    label: event.title,
  }))
  const sortedRecentItems = [
    ...channelItems.sort((a, b) => a.eventSlug.localeCompare(b.eventSlug) || a.label.localeCompare(b.label)),
    ...eventItems.sort((a, b) => a.label.localeCompare(b.label)),
  ].slice(0, 6)
  const recentItems = assignGroupTints(sortedRecentItems, (item) => item.groupKey)

  return (
    <Layout hideHeader title="Dashboard">
      <section className="space-y-4">
        <DashboardActionCards actionItems={actionItems} canManageUsers={canManageUsers} />
        <PendingJoinRequestsPanel memberships={pendingJoinRequests} returnPath="/dashboard" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Active events', String(summary.activeEvents), '/events?status=active'],
            ['Draft events', String(summary.draftEvents), '/events?status=draft'],
            ['Archived events', String(summary.archivedEvents), '/events?status=archived'],
            ['Channels', String(summary.totalChannels), '/channels'],
          ].map(([label, value, href]) => (
            <Link key={label} href={href} className="us-panel block px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                {label}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                {value}
              </p>
            </Link>
          ))}
        </div>

        {recentItems.length > 0 ? (
          <article className="us-panel px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                Recently updated
              </p>
              <div className="flex flex-wrap gap-2">
                <Link className="us-button-secondary px-3 py-2 text-sm font-medium" href="/events">
                  All events
                </Link>
                <Link className="us-button-secondary px-3 py-2 text-sm font-medium" href="/channels">
                  All channels
                </Link>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {recentItems.map((item) => (
                <li key={item.key}>
                  <ListGroupRow
                    as={Link}
                    className="block rounded-2xl border px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-md"
                    href={item.href}
                    rowTint={item.rowTint}
                    style={{ borderColor: 'var(--us-border)', color: 'var(--us-green-dark)' }}
                  >
                    {item.label}
                  </ListGroupRow>
                </li>
              ))}
            </ul>
          </article>
        ) : null}

        {canCreateEventsUser ? (
          <Link className="us-button-primary inline-flex px-5 py-3 text-sm font-medium" href="/events/new">
            Create event
          </Link>
        ) : null}
      </section>
    </Layout>
  )
}
