'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useState } from 'react'

import type { NavChild } from '@/features/types'

type AppNavItem = {
  badge?: number
  children?: NavChild[]
  href: string
  label: string
}

type AppNavProps = {
  items: AppNavItem[]
}

export function AppNav({ items }: AppNavProps) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const navId = useId()

  const closeSubmenu = useCallback(() => setOpenKey(null), [])

  const toggleItem = useCallback((href: string) => {
    setOpenKey((current) => (current === href ? null : href))
  }, [])

  useEffect(() => {
    if (!openKey) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenKey(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openKey])

  return (
    <nav aria-label="App navigation" className="us-app-nav relative z-10">
      {items.map((item) => {
        const hasChildren = Boolean(item.children?.length)
        const isOpen = openKey === item.href
        const submenuId = `${navId}-${item.href.replace(/\W+/g, '-')}-submenu`

        return (
          <div
            key={item.href}
            className={`us-app-nav__item${hasChildren ? ' us-app-nav__item--has-children' : ''}${isOpen ? ' us-app-nav__item--open' : ''}`}
          >
            <div className="us-app-nav__link-row">
              {hasChildren ? (
                <div className="us-app-nav__control">
                  <Link className="us-app-nav__link us-app-nav__link--split" href={item.href}>
                    <span>{item.label}</span>
                    {item.badge ? (
                      <span className="us-app-nav__badge" title={`${item.badge} pending join request${item.badge === 1 ? '' : 's'}`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                  <button
                    aria-controls={submenuId}
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? 'Hide' : 'Show'} ${item.label} submenu`}
                    className="us-app-nav__toggle"
                    type="button"
                    onClick={() => toggleItem(item.href)}
                  >
                    <span aria-hidden="true" className="us-app-nav__caret">
                      ▾
                    </span>
                  </button>
                </div>
              ) : (
                <Link className="us-app-nav__link" href={item.href}>
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className="us-app-nav__badge" title={`${item.badge} pending join request${item.badge === 1 ? '' : 's'}`}>
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              )}
            </div>
            {hasChildren ? (
              <div className="us-app-nav__submenu" id={submenuId}>
                <div className="us-app-nav__submenu-panel">
                  {item.children?.map((child) => (
                    <Link
                      key={`${child.href}-${child.label}`}
                      className={`us-app-nav__sublink${child.variant === 'viewall' ? ' us-app-nav__sublink--viewall' : ''}`}
                      href={child.href}
                      onClick={closeSubmenu}
                      tabIndex={isOpen ? undefined : -1}
                    >
                      {child.status ? (
                        <span aria-hidden="true" className={`us-app-nav__dot us-app-nav__dot--${child.status}`} />
                      ) : null}
                      <span className="min-w-0 truncate">{child.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )
}
