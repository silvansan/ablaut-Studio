'use client'

import { useMemo, useState } from 'react'

type ListBulkActionsPanelProps = {
  children: React.ReactNode
  description: string
  selectedCount: number
  title?: string
}

export function ListBulkActionsPanel({
  children,
  description,
  selectedCount,
  title = 'Bulk actions',
}: ListBulkActionsPanelProps) {
  // One bar, always the same height: idle text and the active toolbar swap in place,
  // so selecting rows never pushes the list down.
  return (
    <section
      aria-label={title}
      className="us-panel flex min-h-14 items-center gap-4 px-4 py-2"
    >
      {selectedCount === 0 ? (
        <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
          Select rows to enable bulk actions.
        </p>
      ) : (
        <>
          <p className="whitespace-nowrap text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }} title={description}>
            {selectedCount} selected
          </p>
          <div className="min-w-0 flex-1 overflow-x-auto">{children}</div>
        </>
      )}
    </section>
  )
}

type BulkActionSelectProps = {
  action: string
  onActionChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}

export function BulkActionSelect({ action, onActionChange, options }: BulkActionSelectProps) {
  return (
    <label className="flex items-center">
      <span className="sr-only">Action</span>
      <select
        className="us-input us-input--inline"
        onChange={(event) => onActionChange(event.target.value)}
        value={action}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function useBulkSelection<T extends string | number>() {
  const [selectedKeys, setSelectedKeys] = useState<Set<T>>(new Set())

  const selectedCount = selectedKeys.size

  function toggleKey(key: T) {
    setSelectedKeys((current) => {
      const next = new Set(current)

      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }

      return next
    })
  }

  function toggleAll(keys: T[]) {
    setSelectedKeys((current) => {
      const allSelected = keys.length > 0 && keys.every((key) => current.has(key))

      if (allSelected) {
        return new Set()
      }

      return new Set(keys)
    })
  }

  function clearSelection() {
    setSelectedKeys(new Set())
  }

  return {
    clearSelection,
    selectedCount,
    selectedKeys,
    toggleAll,
    toggleKey,
  }
}

export function useVisibleBulkKeys<T extends string | number>(items: Array<{ key: T; selectable?: boolean }>) {
  return useMemo(
    () => items.filter((item) => item.selectable !== false).map((item) => item.key),
    [items],
  )
}
