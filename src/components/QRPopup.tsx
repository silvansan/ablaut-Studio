'use client'

import { useState } from 'react'

import { DownloadIcon, OpenLinkIcon, QRCodeIcon } from '@/components/ActionIcons'
import { ModalPortal } from '@/components/ModalPortal'
import { QrCardPreview } from '@/components/QrCardPreview'

type QRPopupProps = {
  appearance?: 'cluster-inner' | 'default'
  clusterVariant?: 'listener' | 'speaker'
  fileName?: string
  label: string
  qrDataUrl: string
  triggerLabel?: string
  url: string
}

export function QRPopup({
  appearance = 'default',
  clusterVariant = 'listener',
  fileName,
  label,
  qrDataUrl,
  triggerLabel = `Show ${label} QR`,
  url,
}: QRPopupProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [open, setOpen] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <>
      <button
        aria-label={triggerLabel}
        className={
          appearance === 'cluster-inner'
            ? `us-route-cluster-inner-btn us-route-cluster-inner-btn-${clusterVariant}`
            : 'inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/80 transition hover:-translate-y-0.5 hover:shadow-md'
        }
        onClick={(event) => {
          event.stopPropagation()
          setOpen(true)
        }}
        style={
          appearance === 'cluster-inner'
            ? undefined
            : { borderColor: 'var(--us-border)', color: 'var(--us-blue-dark)' }
        }
        title={triggerLabel}
        type="button"
      >
        <QRCodeIcon />
      </button>

      {open ? (
        <ModalPortal>
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/42 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label={`${label} QR code`}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-[min(96vw,560px)] rounded-3xl border bg-white p-5 shadow-2xl transition-all duration-200"
            onClick={(event) => event.stopPropagation()}
            style={{ borderColor: 'var(--us-border)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                  QR code
                </p>
                <h2 className="mt-1 text-xl font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                  {label}
                </h2>
              </div>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-full border text-lg"
                onClick={() => setOpen(false)}
                style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}
                type="button"
              >
                ×
              </button>
            </div>

            <div className="mt-5">
              <QrCardPreview alt={`${label} QR code for ${url}`} qrDataUrl={qrDataUrl} />
            </div>

            <p className="mt-4 break-all text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
              {url}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button className="us-button-primary px-3 py-2 text-sm font-medium" onClick={copyLink} type="button">
                {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy link'}
              </button>
              <a
                className="us-button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm font-medium"
                download={fileName ?? `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`}
                href={qrDataUrl}
              >
                <DownloadIcon />
                PNG
              </a>
              <a className="us-button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm font-medium" href={url} rel="noreferrer" target="_blank">
                <OpenLinkIcon />
                Open
              </a>
            </div>
          </div>
        </div>
        </ModalPortal>
      ) : null}
    </>
  )
}
