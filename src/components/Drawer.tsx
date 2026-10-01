'use client'

import { useEffect, useState, type ReactNode } from 'react'

import { ModalPortal } from '@/components/ModalPortal'

type DrawerProps = {
  children: ReactNode
  description?: string
  onClose: () => void
  open: boolean
  title: string
}

export function Drawer({ children, description, onClose, open, title }: DrawerProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }

    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
        <button
          aria-label="Close drawer"
          className="us-scrim absolute inset-0"
          onClick={onClose}
          type="button"
        />
        <aside
          aria-label={title}
          aria-modal="true"
          className={`relative flex h-full w-full max-w-md flex-col border-l transition-transform duration-200 ease-out ${
            visible ? 'translate-x-0' : 'translate-x-full'
          }`}
          role="dialog"
          style={{
            backgroundColor: 'var(--us-card)',
            borderColor: 'var(--us-border)',
            boxShadow: 'var(--us-shadow-strong)',
          }}
        >
          <div
            className="flex items-start justify-between gap-4 border-b px-5 py-5"
            style={{
              background: 'var(--us-tint-gradient)',
              borderColor: 'var(--us-border)',
            }}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                {title}
              </p>
              {description ? (
                <p className="mt-1 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
                  {description}
                </p>
              ) : null}
            </div>
            <button
              className="flex h-9 w-9 flex-none items-center justify-center rounded-full border text-lg"
              onClick={onClose}
              style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}
              type="button"
            >
              ×
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>
        </aside>
      </div>
    </ModalPortal>
  )
}
