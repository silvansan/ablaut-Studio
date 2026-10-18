'use client'

import { Children, useMemo, useState, type ElementType, type ReactNode } from 'react'

import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/list-ui'

type TruncatedListProps = {
  as?: ElementType
  children: ReactNode
  className?: string
  /** Classes for the "Showing N of M" / "Show more" area, e.g. padding inside a panel. */
  footerClassName?: string
  initialCount?: number
  itemLabel?: string
  listClassName?: string
}

export function TruncatedList({
  as: ListTag = 'div',
  children,
  className,
  footerClassName,
  initialCount = DEFAULT_LIST_PAGE_SIZE,
  itemLabel = 'items',
  listClassName,
}: TruncatedListProps) {
  const items = useMemo(() => Children.toArray(children).filter(Boolean), [children])
  const [visibleCount, setVisibleCount] = useState(initialCount)
  const total = items.length
  const needsTruncation = total > initialCount
  const shown = needsTruncation ? items.slice(0, visibleCount) : items
  const remaining = Math.max(0, total - visibleCount)

  return (
    <div className={className}>
      <ListTag className={listClassName}>{shown}</ListTag>
      <div className={footerClassName}>
      {needsTruncation ? (
        <p className="mt-2 text-xs" style={{ color: 'var(--us-muted)' }}>
          Showing {Math.min(visibleCount, total)} of {total} {itemLabel}
        </p>
      ) : null}
      {needsTruncation && remaining > 0 ? (
        <button
          className="us-button-secondary mt-3 px-4 py-2.5 text-sm font-medium"
          onClick={() => setVisibleCount((count) => Math.min(count + initialCount, total))}
          type="button"
        >
          Show more ({remaining} remaining)
        </button>
      ) : null}
      {needsTruncation && visibleCount >= total ? (
        <button
          className="mt-3 text-sm font-medium hover:underline"
          onClick={() => setVisibleCount(initialCount)}
          style={{ color: 'var(--us-blue-dark)' }}
          type="button"
        >
          Show less
        </button>
      ) : null}
      </div>
    </div>
  )
}
