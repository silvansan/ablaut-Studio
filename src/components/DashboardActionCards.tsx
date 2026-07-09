import Link from 'next/link'

import type { DashboardActionItems, DashboardEvent } from '@/lib/dashboard-data'

type DashboardActionCardsProps = {
  actionItems: DashboardActionItems
  canManageUsers: boolean
}

function formatEventWhen(event: DashboardEvent): string {
  if (!event.dateStart) {
    return 'No start time set'
  }

  return new Date(event.dateStart).toLocaleString()
}

export function DashboardActionCards({ actionItems, canManageUsers }: DashboardActionCardsProps) {
  const cards = [
    actionItems.nextEvent
      ? {
          body: `${formatEventWhen(actionItems.nextEvent)} · ${actionItems.nextEvent.channelCount} channels`,
          href: `/events/${actionItems.nextEvent.slug}`,
          label: 'Next event',
          title: actionItems.nextEvent.title,
        }
      : null,
    canManageUsers && actionItems.pendingJoinRequestCount > 0
      ? {
          body: `${actionItems.pendingJoinRequestCount} waiting for approval`,
          href: '/users?status=pending',
          label: 'Join requests',
          title: 'Review pending users',
        }
      : null,
    canManageUsers && actionItems.pendingInviteCount > 0
      ? {
          body: `${actionItems.pendingInviteCount} invites not accepted yet`,
          href: '/users?status=pending',
          label: 'Pending invites',
          title: 'Follow up on invites',
        }
      : null,
    actionItems.channelsNeedingSetup.length > 0
      ? {
          body: `${actionItems.channelsNeedingSetup.length} channels need attention`,
          href: '/channels',
          label: 'Channel setup',
          title: 'Channels needing setup',
        }
      : null,
  ].filter(Boolean)

  if (cards.length === 0) {
    return null
  }

  return (
    <article className="us-panel px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
        Needs attention
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {cards.map((card) =>
          card ? (
            <Link
              className="block rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md"
              href={card.href}
              key={card.label}
              style={{ borderColor: 'var(--us-border)' }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--us-blue-dark)' }}>
                {card.label}
              </p>
              <p className="mt-2 text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                {card.title}
              </p>
              <p className="mt-1 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
                {card.body}
              </p>
            </Link>
          ) : null,
        )}
      </div>
      {actionItems.channelsNeedingSetup.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {actionItems.channelsNeedingSetup.map((channel) => (
            <li key={`${channel.eventSlug}:${channel.name}`}>
              <Link className="text-sm font-medium hover:underline" href={channel.href} style={{ color: 'var(--us-blue-dark)' }}>
                {channel.eventTitle} · {channel.name}
              </Link>
              <span className="ml-2 text-sm" style={{ color: 'var(--us-muted)' }}>
                {channel.reason}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}
