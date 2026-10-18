import Link from '@/components/OrgLink'

import { Logo } from './Logo'
import { OrgSwitcher, type OrgSwitcherOption } from './OrgSwitcher'
import { SidebarNav, type SidebarNavItem } from './SidebarNav'

type AppSidebarProps = {
  currentKey: null | string
  email: string
  navItems: SidebarNavItem[]
  organizations: OrgSwitcherOption[]
  platformItems: SidebarNavItem[]
  recentItems: SidebarNavItem[]
}

/** The one navigation surface: organization on top, work in the middle, account at the bottom. */
export function AppSidebar({
  currentKey,
  email,
  navItems,
  organizations,
  platformItems,
  recentItems,
}: AppSidebarProps) {
  return (
    <div className="us-sidebar">
      <Logo compact href="/events" />
      {organizations.length > 0 ? <OrgSwitcher currentKey={currentKey} organizations={organizations} /> : null}
      <SidebarNav items={navItems} label="Main" />
      <SidebarNav heading="Recent" items={recentItems} label="Recent events" />
      <SidebarNav heading="Platform" items={platformItems} label="Platform" />
      <div className="us-side-footer">
        <Link className="us-side-link" href="/profile">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">My profile</span>
            <span className="block truncate text-xs font-normal" style={{ color: 'var(--us-muted)' }}>
              {email}
            </span>
          </span>
        </Link>
        <Link className="us-side-link" href="/feedback">
          <span className="min-w-0 truncate">Send feedback</span>
        </Link>
      </div>
    </div>
  )
}
