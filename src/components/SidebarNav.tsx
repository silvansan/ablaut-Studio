'use client'

import { usePathname } from 'next/navigation'

import Link, { useOrgKey } from '@/components/OrgLink'
import { toPublicPath } from '@/lib/org-paths'

export type SidebarNavItem = {
  badge?: number
  /** Internal href (`/events`, `/users`) or a public one (`/platform/organizations`). */
  href: string
  label: string
  status?: 'active' | 'archived' | 'draft'
}

type SidebarNavProps = {
  heading?: string
  items: SidebarNavItem[]
  /** Section headings stay out of the accessibility tree order when a nav has a label already. */
  label: string
}

function isActive(pathname: string, publicHref: string, orgKey: null | string) {
  if (pathname === publicHref || pathname.startsWith(`${publicHref}/`)) {
    return true
  }

  // `/o/<key>` on its own shows the events list.
  return Boolean(orgKey) && publicHref === `/o/${orgKey}/events` && pathname === `/o/${orgKey}`
}

export function SidebarNav({ heading, items, label }: SidebarNavProps) {
  const pathname = usePathname()
  const orgKey = useOrgKey()

  if (items.length === 0) {
    return null
  }

  return (
    <nav aria-label={label} className="us-side-group">
      {heading ? <p className="us-side-heading">{heading}</p> : null}
      {items.map((item) => {
        const active = isActive(pathname, toPublicPath(item.href, orgKey), orgKey)

        return (
          <Link
            aria-current={active ? 'page' : undefined}
            className={`us-side-link${active ? ' us-side-link--active' : ''}`}
            href={item.href}
            key={`${item.href}-${item.label}`}
          >
            {item.status ? <span aria-hidden="true" className={`us-side-dot us-side-dot--${item.status}`} /> : null}
            <span className="min-w-0 truncate">{item.label}</span>
            {item.badge ? (
              <span className="us-side-link__badge" title={`${item.badge} waiting`}>
                {item.badge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}
