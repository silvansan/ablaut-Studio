'use client'

import { usePathname } from 'next/navigation'

import Link, { useOrgKey } from '@/components/OrgLink'
import { toPublicPath } from '@/lib/org-paths'

type EventTabsProps = {
  /** People and Settings are for people who can manage the event. */
  canManage: boolean
  eventSlug: string
}

/** The event's workspace navigation. Each tab is a real page, so links and refreshes keep their place. */
export function EventTabs({ canManage, eventSlug }: EventTabsProps) {
  const pathname = usePathname()
  const orgKey = useOrgKey()
  const base = `/events/${eventSlug}`
  const tabs = [
    { href: base, label: 'Channels', matchChildren: ['/channels'] },
    ...(canManage ? [{ href: `${base}/people`, label: 'People', matchChildren: [] as string[] }] : []),
    { href: `${base}/share`, label: 'Share', matchChildren: [] as string[] },
    ...(canManage ? [{ href: `${base}/settings`, label: 'Settings', matchChildren: [] as string[] }] : []),
  ]

  return (
    <nav aria-label="Event sections" className="us-tabs">
      {tabs.map((tab) => {
        const publicHref = toPublicPath(tab.href, orgKey)
        const active =
          pathname === publicHref ||
          tab.matchChildren.some((child) => pathname.startsWith(`${publicHref}${child}`)) ||
          (tab.href === base && pathname === `/o/${orgKey}/events/${eventSlug}`)

        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={`us-tab${active ? ' us-tab--active' : ''}`}
            href={tab.href}
            key={tab.href}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
