'use client'

import { useState, type ReactNode } from 'react'

import { MinusIcon, PlusIcon } from '@/components/ActionIcons'

type CollapsiblePanelProps = {
  children: ReactNode
  defaultOpen?: boolean
  description?: string
  title: string
}

export function CollapsiblePanel({ children, defaultOpen = false, description, title }: CollapsiblePanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="us-panel overflow-hidden">
      <button
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
        onClick={() => setOpen((value) => !value)}
        style={{
          background: 'var(--us-tint-gradient)',
          color: 'var(--us-green-dark)',
        }}
        type="button"
      >
        <span>
          <span className="block text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            {title}
          </span>
          {description && !open ? (
            <span className="mt-1 block text-sm font-normal leading-6" style={{ color: 'var(--us-muted)' }}>
              {description}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full"
          style={{ backgroundColor: 'color-mix(in srgb, white 72%, transparent)', color: 'var(--us-blue-dark)' }}
        >
          {open ? <MinusIcon /> : <PlusIcon />}
        </span>
      </button>
      {open ? (
        <div className="border-t px-4 py-5" style={{ borderColor: 'var(--us-border)' }}>
          {children}
        </div>
      ) : null}
    </div>
  )
}
