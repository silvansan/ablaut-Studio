'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

import { UserCircleIcon } from '@/components/ActionIcons'
import Link, { useOrgKey } from '@/components/OrgLink'
import { toPublicPath } from '@/lib/org-paths'

type MobileTab = {
  badge?: number
  href: string
  label: string
}

type MobileAppChromeProps = {
  children: ReactNode
  orgName: null | string
  showSidebar: boolean
  /** The same sidebar the desktop shows, rendered inside the slide-down menu. */
  sidebar: ReactNode
  tabs: MobileTab[]
}

function tabMatches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MobileAppChrome({ children, orgName, showSidebar, sidebar, tabs }: MobileAppChromeProps) {
  const pathname = usePathname()
  const orgKey = useOrgKey()
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!drawerOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDrawerOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [drawerOpen])

  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <>
      <div className="us-topbar flex xl:hidden" style={{ paddingTop: 'max(0.625rem, env(safe-area-inset-top))' }}>
        <button
          aria-expanded={drawerOpen}
          aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
          className="us-button-secondary px-3 py-1.5 text-sm font-medium"
          onClick={() => setDrawerOpen((open) => !open)}
          type="button"
        >
          Menu
        </button>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          {orgName ?? 'ablaut'}
        </p>
        <Link
          aria-label="My profile"
          className="us-button-secondary inline-flex h-9 w-9 items-center justify-center"
          href="/profile"
        >
          <UserCircleIcon />
        </Link>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[10040] xl:hidden">
          <button
            aria-label="Close menu overlay"
            className="us-scrim absolute inset-0"
            onClick={() => setDrawerOpen(false)}
            type="button"
          />
          <aside
            className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] overflow-y-auto"
            style={{ background: 'var(--us-card)', boxShadow: 'var(--us-shadow-strong)' }}
          >
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="pb-16 xl:pb-0">{children}</div>

      {tabs.length > 0 ? (
        <nav
          aria-label="Primary"
          className="us-mobile-tabbar fixed inset-x-0 bottom-0 z-[10030] border-t xl:hidden"
          style={{
            backgroundColor: 'var(--us-card)',
            borderColor: 'var(--us-border)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
            {tabs.map((tab) => {
              const active = tabMatches(pathname, toPublicPath(tab.href, orgKey))

              return (
                <Link
                  className={`us-mobile-tabbar__link flex flex-col items-center gap-1 px-2 py-2.5 text-center font-semibold leading-tight ${active ? 'us-mobile-tabbar__link--active' : ''}`}
                  href={tab.href}
                  key={tab.href}
                  style={{ color: active ? 'var(--us-green-dark)' : 'var(--us-muted)' }}
                >
                  <span>{tab.label}</span>
                  {tab.badge ? <span className="us-mobile-tabbar__badge">{tab.badge}</span> : null}
                </Link>
              )
            })}
          </div>
        </nav>
      ) : null}
    </>
  )
}
