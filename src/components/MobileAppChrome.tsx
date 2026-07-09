'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type ReactNode } from 'react'

import { UserCircleIcon } from '@/components/ActionIcons'
import { AppNav } from '@/components/AppNav'
import { Logo } from '@/components/Logo'

type MobileNavItem = {
  badge?: number
  children?: Array<{ href: string; label: string }>
  href: string
  label: string
}

type MobileAppChromeProps = {
  children: ReactNode
  email: string
  items: MobileNavItem[]
  showSidebar: boolean
}

function tabMatches(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard'
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MobileAppChrome({ children, email, items, showSidebar }: MobileAppChromeProps) {
  const pathname = usePathname()
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

  const bottomTabs = items
    .filter((item) => ['/dashboard', '/events', '/channels', '/organizations', '/settings', '/users'].includes(item.href))
    .slice(0, 5)

  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <>
      <div className="xl:hidden">
        <div
          className="us-panel mb-3 flex items-center justify-between gap-3 px-4 py-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <button
            aria-expanded={drawerOpen}
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            className="us-button-secondary px-3 py-2 text-sm font-medium"
            onClick={() => setDrawerOpen((open) => !open)}
            type="button"
          >
            Menu
          </button>
          <Link className="min-w-0 flex-1" href="/dashboard">
            <Logo />
          </Link>
          <Link aria-label="My profile" className="us-button-secondary inline-flex h-10 w-10 items-center justify-center" href="/profile">
            <UserCircleIcon />
          </Link>
        </div>

        {drawerOpen ? (
          <div className="fixed inset-0 z-[10040] xl:hidden">
            <button
              aria-label="Close menu overlay"
              className="absolute inset-0 bg-black/40"
              onClick={() => setDrawerOpen(false)}
              type="button"
            />
            <aside
              className="us-panel absolute left-3 right-3 top-3 max-h-[calc(100vh-6rem)] overflow-y-auto"
              style={{ top: 'max(0.75rem, env(safe-area-inset-top))' }}
            >
              <div
                className="us-hero-glow flex flex-col gap-5 rounded-[inherit] px-5 py-5"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(22, 63, 53, 0.98) 0%, rgba(18, 107, 182, 0.94) 100%)',
                }}
              >
                <Logo theme="light" />
                <AppNav items={items} />
                <Link
                  className="flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-semibold"
                  href="/profile"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.24)',
                    color: 'rgba(255,255,255,0.96)',
                  }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white">
                    <UserCircleIcon />
                  </span>
                  <span className="min-w-0">
                    <span className="block">My profile</span>
                    <span className="block truncate text-xs font-normal opacity-75">{email}</span>
                  </span>
                </Link>
              </div>
            </aside>
          </div>
        ) : null}
      </div>

      <div className="pb-20 xl:pb-0">{children}</div>

      {bottomTabs.length > 0 ? (
        <nav
          aria-label="Primary"
          className="us-mobile-tabbar fixed inset-x-0 bottom-0 z-[10030] border-t xl:hidden"
          style={{
            backgroundColor: 'var(--us-card)',
            borderColor: 'var(--us-border)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${bottomTabs.length}, minmax(0, 1fr))` }}>
            {bottomTabs.map((item) => {
              const active = tabMatches(pathname, item.href)

              return (
                <Link
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 text-center text-[0.68rem] font-semibold leading-tight ${active ? 'us-mobile-tabbar__link--active' : ''}`}
                  href={item.href}
                  key={item.href}
                  style={{ color: active ? 'var(--us-blue-dark)' : 'var(--us-muted)' }}
                >
                  <span>{item.label}</span>
                  {item.badge ? <span className="us-mobile-tabbar__badge">{item.badge}</span> : null}
                </Link>
              )
            })}
          </div>
        </nav>
      ) : null}
    </>
  )
}
