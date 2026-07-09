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
  if (selectedCount === 0) {
    return (
      <div
        className="rounded-3xl border border-dashed px-4 py-3 text-sm leading-6"
        style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}
      >
        Select rows to enable bulk actions.
      </div>
    )
  }

  return (
    <div className="us-panel px-6 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
        {title}
      </p>
      <p className="mt-2 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
        {selectedCount} selected · {description}
      </p>
      <div className="mt-4">{children}</div>
    </div>
  )
}

type BulkActionSelectProps = {
  action: string
  onActionChange: (value: string) => void
  options: Array<{ label: string; value: string }>
}

export function BulkActionSelect({ action, onActionChange, options }: BulkActionSelectProps) {
  return (
    <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
      Action
      <select
        className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
        onChange={(event) => onActionChange(event.target.value)}
        style={{ borderColor: 'var(--us-border)' }}
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
