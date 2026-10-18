'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { useOrgKey } from '@/components/OrgLink'
import { ModalPortal } from '@/components/ModalPortal'
import { toPublicPath } from '@/lib/org-paths'

export type PaletteItem = {
  /** Internal href (`/events/x`) or a public one (`/o/<key>/events`, `/platform/server`). */
  href: string
  /** Secondary text, searched too: the organization of an event, a section name. */
  hint?: string
  id: string
  label: string
  status?: 'active' | 'archived' | 'draft'
}

type CommandPaletteProps = {
  items: PaletteItem[]
}

const MAX_RESULTS = 30

/**
 * Ctrl/Cmd+K jump-to: events, sections, and organizations in one search box. Built for event
 * day, when finding the right event by name beats clicking through lists.
 */
export function CommandPalette({ items }: CommandPaletteProps) {
  const router = useRouter()
  const orgKey = useOrgKey()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const matches = needle
      ? items.filter((item) => `${item.label} ${item.hint ?? ''}`.toLowerCase().includes(needle))
      : items

    return matches.slice(0, MAX_RESULTS)
  }, [items, query])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    setActive(0)
  }, [query, open])

  function close() {
    setOpen(false)
    setQuery('')
    triggerRef.current?.focus()
  }

  function go(item: PaletteItem) {
    setOpen(false)
    setQuery('')
    router.push(toPublicPath(item.href, orgKey))
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      close()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((value) => Math.min(results.length - 1, value + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((value) => Math.max(0, value - 1))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const chosen = results[active]

      if (chosen) {
        go(chosen)
      }
    }
  }

  return (
    <>
      <button
        aria-haspopup="dialog"
        className="us-side-org us-side-search"
        onClick={() => setOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <span className="min-w-0 flex-1 truncate" style={{ color: 'var(--us-muted)' }}>
          Jump to...
        </span>
        <kbd className="us-kbd hidden xl:inline-block">Ctrl K</kbd>
      </button>

      {open ? (
        <ModalPortal>
          <div className="fixed inset-0 z-[10060] flex items-start justify-center px-3 pt-[12vh]" role="presentation">
            <button aria-label="Close search" className="us-scrim absolute inset-0" onClick={close} type="button" />
            <div
              aria-label="Jump to"
              aria-modal="true"
              className="us-modal-card relative w-full max-w-lg overflow-hidden"
              role="dialog"
            >
              <input
                aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
                aria-controls={listId}
                aria-label="Search events, sections and organizations"
                autoFocus
                className="us-input"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search events, sections, organizations"
                role="combobox"
                style={{ border: 0, borderBottom: '1px solid var(--us-border)', borderRadius: 0 }}
                value={query}
                aria-expanded="true"
              />
              <ul className="max-h-80 overflow-y-auto p-1" id={listId} role="listbox">
                {results.map((item, index) => (
                  <li
                    aria-selected={index === active}
                    className="us-side-menu__item"
                    id={`${listId}-${item.id}`}
                    key={item.id}
                    onClick={() => go(item)}
                    onMouseEnter={() => setActive(index)}
                    role="option"
                  >
                    {item.status ? (
                      <span aria-hidden="true" className={`us-side-dot us-side-dot--${item.status}`} />
                    ) : null}
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.hint ? (
                      <span className="shrink-0 text-xs" style={{ color: 'var(--us-muted)' }}>
                        {item.hint}
                      </span>
                    ) : null}
                  </li>
                ))}
                {results.length === 0 ? (
                  <li className="px-3 py-3 text-sm" style={{ color: 'var(--us-muted)' }}>
                    Nothing matches &ldquo;{query}&rdquo;.
                  </li>
                ) : null}
              </ul>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </>
  )
}
