import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getDashboardEvents } from '@/lib/dashboard-data'
import type { User } from '@/payload-types'

const RECENT_EVENTS_LIMIT = 6
const FLYOUT_LIMIT = 8

export type RecentEventEntry = {
  id: number
  at: string
}

export type EventFlyoutItem = {
  href: string
  label: string
  status: 'active' | 'draft' | 'archived'
}

export type EventNavFlyout = {
  items: EventFlyoutItem[]
  totalCount: number
  isEmpty: boolean
}

function parseRecentEntries(value: unknown): RecentEventEntry[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((entry) => {
      if (typeof entry !== 'object' || entry === null) {
        return null
      }

      const id = Number((entry as { id?: unknown }).id)
      const at = String((entry as { at?: unknown }).at ?? '')

      return Number.isFinite(id) ? { id, at } : null
    })
    .filter((entry): entry is RecentEventEntry => entry !== null)
}

// Fire-and-forget: called via `after()`, so a failure here must not throw into the render path.
export async function recordEventAccess(user: Pick<User, 'id' | 'recentEvents'> | null | undefined, eventId: number) {
  if (!user?.id || !Number.isFinite(eventId)) {
    return
  }

  const existing = parseRecentEntries(user.recentEvents)
  const next: RecentEventEntry[] = [
    { id: eventId, at: new Date().toISOString() },
    ...existing.filter((entry) => entry.id !== eventId),
  ].slice(0, RECENT_EVENTS_LIMIT)

  try {
    const payload = await getPayload({ config: configPromise })

    await payload.update({
      collection: 'users',
      id: user.id,
      data: { recentEvents: next },
      overrideAccess: true,
    })
  } catch {
    // Nav ordering is a convenience; a failed write is not worth surfacing.
  }
}

export async function getEventNavFlyout(user: Pick<User, 'recentEvents'> | null | undefined): Promise<EventNavFlyout> {
  if (!user) {
    return { items: [], totalCount: 0, isEmpty: true }
  }

  const events = await getDashboardEvents(1000)
  const byId = new Map(events.map((event) => [event.id, event]))
  const nonArchived = events.filter((event) => event.status !== 'archived')

  const seen = new Set<number>()
  const ordered: typeof events = []

  for (const entry of parseRecentEntries(user.recentEvents)) {
    const event = byId.get(entry.id)

    if (event && event.status !== 'archived' && !seen.has(entry.id)) {
      seen.add(entry.id)
      ordered.push(event)
    }
  }

  const remaining = nonArchived
    .filter((event) => !seen.has(event.id))
    .sort((a, b) => {
      const aStart = a.dateStart ? new Date(a.dateStart).getTime() : 0
      const bStart = b.dateStart ? new Date(b.dateStart).getTime() : 0

      return bStart - aStart
    })

  const items = [...ordered, ...remaining].slice(0, FLYOUT_LIMIT).map((event) => ({
    href: `/events/${event.slug}`,
    label: event.title,
    status: (event.status ?? 'active') as EventFlyoutItem['status'],
  }))

  return {
    items,
    totalCount: events.length,
    isEmpty: events.length === 0,
  }
}
