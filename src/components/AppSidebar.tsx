import Link from '@/components/OrgLink'

import { CommandPalette, type PaletteItem } from './CommandPalette'
import { Logo } from './Logo'
import { OrgSwitcher, type OrgSwitcherOption } from './OrgSwitcher'
import { SidebarNav, type SidebarNavItem } from './SidebarNav'

type AppSidebarProps = {
  currentKey: null | string
  email: string
  navItems: SidebarNavItem[]
  organizations: OrgSwitcherOption[]
  paletteItems: PaletteItem[]
  platformItems: SidebarNavItem[]
  recentItems: SidebarNavItem[]
}

/** The one navigation surface: organization on top, work in the middle, account at the bottom. */
export function AppSidebar({
  currentKey,
  email,
  navItems,
  organizations,
  paletteItems,
  platformItems,
  recentItems,
}: AppSidebarProps) {
  return (
    <div className="us-sidebar">
      <Logo compact href="/events" />
      {organizations.length > 0 ? <OrgSwitcher currentKey={currentKey} organizations={organizations} /> : null}
      <CommandPalette items={paletteItems} />
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
