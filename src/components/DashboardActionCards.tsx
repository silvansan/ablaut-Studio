import { AlertIcon, CalendarIcon, UserCircleIcon } from '@/components/ActionIcons'
import Link from '@/components/OrgLink'

import type { DashboardActionItems, DashboardEvent } from '@/lib/dashboard-data'

type DashboardActionCardsProps = {
  actionItems: DashboardActionItems
  canManageUsers: boolean
}

type Item = {
  detail?: string
  href: string
  icon: 'alert' | 'calendar' | 'person'
  key: string
  label: string
  /** danger = needs action now, warning = follow up, plain = just so you know. */
  tone: 'danger' | 'plain' | 'warning'
  tooltip?: string
}

const MAX_CHANNEL_ITEMS = 3

function formatEventWhen(event: DashboardEvent): string {
  return event.dateStart ? new Date(event.dateStart).toLocaleString() : 'No start time'
}

function plural(count: number, one: string, other: string) {
  return `${count} ${count === 1 ? one : other}`
}

/** What deserves a look right now, as a slim row of small items instead of a card full of cards. */
export function DashboardActionCards({ actionItems, canManageUsers }: DashboardActionCardsProps) {
  const items: Item[] = []

  if (actionItems.nextEvent) {
    items.push({
      detail: `${formatEventWhen(actionItems.nextEvent)} · ${plural(actionItems.nextEvent.channelCount, 'channel', 'channels')}`,
      href: `/events/${actionItems.nextEvent.slug}`,
      icon: 'calendar',
      key: 'next-event',
      label: actionItems.nextEvent.title,
      tone: 'plain',
      tooltip: 'Next event',
    })
  }

  if (canManageUsers && actionItems.pendingJoinRequestCount > 0) {
    items.push({
      href: '/users?status=pending',
      icon: 'person',
      key: 'join-requests',
      label: plural(actionItems.pendingJoinRequestCount, 'join request', 'join requests'),
      tone: 'danger',
      tooltip: 'Waiting for your approval',
    })
  }

  if (canManageUsers && actionItems.pendingInviteCount > 0) {
    items.push({
      href: '/users?status=pending',
      icon: 'person',
      key: 'invites',
      label: plural(actionItems.pendingInviteCount, 'invite not accepted', 'invites not accepted'),
      tone: 'warning',
      tooltip: 'Invitations nobody has accepted yet',
    })
  }

  actionItems.channelsNeedingSetup.slice(0, MAX_CHANNEL_ITEMS).forEach((channel) => {
    items.push({
      detail: channel.reason,
      href: channel.href,
      icon: 'alert',
      key: `channel-${channel.eventSlug}-${channel.name}`,
      label: `${channel.eventTitle} · ${channel.name}`,
      tone: 'danger',
    })
  })

  const hiddenChannels = actionItems.channelsNeedingSetup.length - MAX_CHANNEL_ITEMS

  if (items.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => (
        <Link className={`us-attn us-attn--${item.tone}`} href={item.href} key={item.key} title={item.tooltip}>
          <span className="us-attn__icon">
            {item.icon === 'calendar' ? <CalendarIcon /> : item.icon === 'person' ? <UserCircleIcon className="h-4 w-4" /> : <AlertIcon />}
          </span>
          <span className="min-w-0 truncate font-medium">{item.label}</span>
          {item.detail ? (
            <span className="hidden truncate sm:inline" style={{ color: 'var(--us-muted)' }}>
              {item.detail}
            </span>
          ) : null}
        </Link>
      ))}
      {hiddenChannels > 0 ? (
        <span className="text-xs" style={{ color: 'var(--us-muted)' }}>
          +{hiddenChannels} more
        </span>
      ) : null}
    </div>
  )
}
