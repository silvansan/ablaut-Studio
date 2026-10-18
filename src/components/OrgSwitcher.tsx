'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'

export type OrgSwitcherOption = {
  key: string
  name: string
}

type OrgSwitcherProps = {
  currentKey: null | string
  organizations: OrgSwitcherOption[]
}

function initialOf(name: string) {
  return (name.trim()[0] ?? '?').toUpperCase()
}

/**
 * Shows which organization everything below belongs to. With one organization it is a plain
 * label; with several it opens a list. Switching lands on that organization's events.
 */
export function OrgSwitcher({ currentKey, organizations }: OrgSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const current = organizations.find((organization) => organization.key === currentKey) ?? null
  const label = current?.name ?? organizations[0]?.name ?? 'No organization'

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointer)
    document.addEventListener('keydown', handleKey)

    return () => {
      document.removeEventListener('mousedown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  if (organizations.length <= 1) {
    return (
      <div className="us-side-org us-side-org--static" title={label}>
        <span aria-hidden="true" className="us-side-org__mark">
          {initialOf(label)}
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </div>
    )
  }

  const visible = query.trim()
    ? organizations.filter((organization) => organization.name.toLowerCase().includes(query.trim().toLowerCase()))
    : organizations

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="us-side-org"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <span aria-hidden="true" className="us-side-org__mark">
          {initialOf(label)}
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        <span aria-hidden="true" className="us-side-org__caret">
          ▾
        </span>
      </button>

      {open ? (
        <div className="us-side-menu" id={listId} role="listbox">
          {organizations.length > 6 ? (
            <input
              aria-label="Find an organization"
              autoFocus
              className="us-input mb-1 text-xs"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find an organization"
              value={query}
            />
          ) : null}
          {visible.map((organization) => (
            <button
              aria-selected={organization.key === currentKey}
              className="us-side-menu__item"
              key={organization.key}
              onClick={() => {
                setOpen(false)
                setQuery('')
                router.push(`/o/${organization.key}/events`)
              }}
              role="option"
              type="button"
            >
              <span aria-hidden="true" className="us-side-org__mark">
                {initialOf(organization.name)}
              </span>
              <span className="min-w-0 flex-1 truncate">{organization.name}</span>
              {organization.key === currentKey ? <span aria-hidden="true">✓</span> : null}
            </button>
          ))}
          {visible.length === 0 ? (
            <p className="px-2 py-2 text-xs" style={{ color: 'var(--us-muted)' }}>
              No match.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
