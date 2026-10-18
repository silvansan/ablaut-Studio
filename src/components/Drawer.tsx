'use client'

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react'

import { ModalPortal } from '@/components/ModalPortal'

type DrawerProps = {
  children: ReactNode
  description?: string
  onClose: () => void
  open: boolean
  title: string
}

/**
 * Slide-over sheet. If the person edited anything inside it, closing by the X, a click outside, or
 * Escape asks whether to save, discard, or keep editing. Closing after a successful save is the
 * caller's job (it just sets `open` to false) and is never interrupted.
 */
export function Drawer({ children, description, onClose, open, title }: DrawerProps) {
  const [visible, setVisible] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const confirmId = useId()

  useEffect(() => {
    if (!open) {
      setVisible(false)
      return
    }

    // A freshly opened drawer starts clean.
    setDirty(false)
    setConfirming(false)

    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  const requestClose = useCallback(() => {
    if (dirty) {
      setConfirming(true)
    } else {
      onClose()
    }
  }, [dirty, onClose])

  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return
      }

      if (confirming) {
        setConfirming(false)
      } else {
        requestClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [confirming, open, requestClose])

  function discard() {
    setConfirming(false)
    setDirty(false)
    onClose()
  }

  function saveChanges() {
    setConfirming(false)
    bodyRef.current?.querySelector('form')?.requestSubmit()
  }

  if (!open) {
    return null
  }

  return (
    <ModalPortal>
      {/* The portal is a React child of whatever opened it (often a clickable row). Stop events here so they never reach it. */}
      <div
        className="fixed inset-0 z-50 flex justify-end"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        role="presentation"
      >
        <button aria-label="Close drawer" className="us-scrim absolute inset-0" onClick={requestClose} type="button" />
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
              aria-label="Close"
              className="flex h-9 w-9 flex-none items-center justify-center rounded-md border text-lg"
              onClick={requestClose}
              style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}
              type="button"
            >
              ×
            </button>
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
            onChange={() => setDirty(true)}
            onInput={() => setDirty(true)}
            ref={bodyRef}
          >
            {children}
          </div>

          {confirming ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center px-4" role="presentation">
              <div className="us-scrim absolute inset-0" />
              <div
                aria-describedby={`${confirmId}-text`}
                aria-labelledby={`${confirmId}-title`}
                aria-modal="true"
                className="us-modal-card relative w-full max-w-sm px-5 py-5"
                role="alertdialog"
              >
                <h3 className="text-base font-semibold" id={`${confirmId}-title`} style={{ color: 'var(--us-green-dark)' }}>
                  Unsaved changes
                </h3>
                <p className="mt-2 text-sm leading-6" id={`${confirmId}-text`} style={{ color: 'var(--us-muted)' }}>
                  You changed something here and have not saved it. Save before closing?
                </p>
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button className="us-button-secondary px-3 py-1.5 text-sm font-medium" onClick={discard} type="button">
                    Discard
                  </button>
                  <button
                    autoFocus
                    className="us-button-secondary px-3 py-1.5 text-sm font-medium"
                    onClick={() => setConfirming(false)}
                    type="button"
                  >
                    Keep editing
                  </button>
                  <button className="us-button-primary px-3 py-1.5 text-sm font-medium" onClick={saveChanges} type="button">
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </ModalPortal>
  )
}
