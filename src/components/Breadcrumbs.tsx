'use client'

import { usePathname } from 'next/navigation'

import Link from '@/components/OrgLink'
import { publicSubpath } from '@/lib/org-paths'

type BreadcrumbsProps = {
  orgKey: null | string
  orgName: null | string
  /** Page title; becomes the last crumb when it adds information beyond the section name. */
  title?: string
  /** Explicit trail after "Organization / Events", from pages that know real titles. */
  trail?: Crumb[]
}

const SECTION_LABELS: Record<string, string> = {
  channels: 'Channels',
  edit: 'Edit',
  events: 'Events',
  new: 'New',
  organizations: 'Organizations',
  people: 'People',
  server: 'Server health',
  settings: 'Settings',
  share: 'Share',
  users: 'All users',
}

type Crumb = { href?: string; label: string }

/** Organization / Section / Page, derived from the URL so every page gets one for free. */
export function Breadcrumbs({ orgKey, orgName, title, trail }: BreadcrumbsProps) {
  const pathname = usePathname()
  const crumbs: Crumb[] = []

  if (pathname.startsWith('/platform')) {
    crumbs.push({ label: 'Platform' })
  } else if (orgKey && orgName) {
    crumbs.push({ href: `/o/${orgKey}/events`, label: orgName })
  }

  if (trail && trail.length > 0) {
    return <CrumbTrail crumbs={[...crumbs, { href: '/events', label: 'Events' }, ...trail]} />
  }

  const sub = pathname.startsWith('/platform') ? pathname.replace(/^\/platform/, '') : publicSubpath(pathname)
  const segments = sub.split('/').filter(Boolean)
  const lastIndex = segments.length - 1
  let href = pathname.startsWith('/platform') ? '/platform' : orgKey ? `/o/${orgKey}` : ''

  segments.forEach((segment, index) => {
    href += `/${segment}`
    const known = SECTION_LABELS[segment]
    const isLast = index === lastIndex

    if (known) {
      crumbs.push({ href: isLast ? undefined : href, label: known })
    } else if (isLast && title) {
      // Dynamic segment (an event URL name, a user id): the page title names it best.
      crumbs.push({ label: title })
    } else {
      crumbs.push({ href: isLast ? undefined : href, label: decodeURIComponent(segment) })
    }
  })

  return <CrumbTrail crumbs={crumbs} />
}

function CrumbTrail({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length === 0) {
    return null
  }

  return (
    <nav aria-label="Breadcrumb" className="us-crumbs">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1

        return (
          <span className="inline-flex min-w-0 items-center gap-1.5" key={`${crumb.label}-${index}`}>
            {index > 0 ? <span aria-hidden="true">/</span> : null}
            {crumb.href && !isLast ? (
              <Link className="truncate" href={crumb.href}>
                {crumb.label}
              </Link>
            ) : (
              <span aria-current={isLast ? 'page' : undefined} className="truncate">
                {crumb.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
