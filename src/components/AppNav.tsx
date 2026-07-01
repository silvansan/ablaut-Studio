'use client'

import Link from 'next/link'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

type AppNavItem = {
  badge?: number
  children?: Array<{ href: string; label: string }>
  href: string
  label: string
}

type AppNavProps = {
  items: AppNavItem[]
}

const LINGER_MS = 1500

function usePrefersHover(): boolean {
  const [prefersHover, setPrefersHover] = useState(true)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover)')
    const update = () => setPrefersHover(mediaQuery.matches)

    update()
    mediaQuery.addEventListener('change', update)

    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return prefersHover
}

export function AppNav({ items }: AppNavProps) {
  const navRef = useRef<HTMLElement>(null)
  const closeTimerRef = useRef<number | null>(null)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const prefersHover = usePrefersHover()
  const navId = useId()

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const openItem = useCallback(
    (href: string) => {
      clearCloseTimer()
      setOpenKey(href)
    },
    [clearCloseTimer],
  )

  const scheduleClose = useCallback(() => {
    clearCloseTimer()
    closeTimerRef.current = window.setTimeout(() => {
      setOpenKey(null)
      closeTimerRef.current = null
    }, LINGER_MS)
  }, [clearCloseTimer])

  const toggleItem = useCallback(
    (href: string) => {
      clearCloseTimer()
      setOpenKey((current) => (current === href ? null : href))
    },
    [clearCloseTimer],
  )

  useEffect(() => {
    if (!openKey) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenKey(null)
        clearCloseTimer()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenKey(null)
        clearCloseTimer()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [clearCloseTimer, openKey])

  useEffect(() => {
    return () => clearCloseTimer()
  }, [clearCloseTimer])

  return (
    <nav ref={navRef} aria-label="App navigation" className="us-app-nav relative z-10">
      {items.map((item) => {
        const hasChildren = Boolean(item.children?.length)
        const isOpen = openKey === item.href
        const submenuId = `${navId}-${item.href.replace(/\W+/g, '-')}-submenu`

        const hoverHandlers =
          hasChildren && prefersHover
            ? {
                onMouseEnter: () => openItem(item.href),
                onMouseLeave: () => scheduleClose(),
              }
            : undefined

        return (
          <div
            key={item.href}
            className={`us-app-nav__item${hasChildren ? ' us-app-nav__item--has-children' : ''}${isOpen ? ' us-app-nav__item--open' : ''}`}
            {...hoverHandlers}
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
              <div className="us-app-nav__submenu" id={submenuId} {...hoverHandlers}>
                <div className="us-app-nav__submenu-panel">
                  {item.children?.map((child) => (
                    <Link
                      key={child.href}
                      className="us-app-nav__sublink"
                      href={child.href}
                      onClick={() => {
                        setOpenKey(null)
                        clearCloseTimer()
                      }}
                    >
                      {child.label}
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
