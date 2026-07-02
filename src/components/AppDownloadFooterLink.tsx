'use client'

import Image from 'next/image'
import { useState } from 'react'

import { AndroidIcon, DownloadIcon, QRCodeIcon } from '@/components/ActionIcons'
import { ModalPortal } from '@/components/ModalPortal'

type AppDownloadFooterLinkProps = {
  downloadPageUrl: string
  latestVersion: string
  qrDataUrl: string
}

export function AppDownloadFooterLink({
  downloadPageUrl,
  latestVersion,
  qrDataUrl,
}: AppDownloadFooterLinkProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="inline-flex items-center gap-1.5 font-medium"
        onClick={() => setOpen(true)}
        style={{ color: 'var(--us-blue-dark)' }}
        type="button"
      >
        <AndroidIcon />
        Android app v{latestVersion}
      </button>

      {open ? (
        <ModalPortal>
          <div
            aria-label="Android app download"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/42 px-4 py-6"
            onClick={() => setOpen(false)}
            role="dialog"
          >
            <div
              className="w-full max-w-[380px] rounded-3xl border bg-white p-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              style={{ borderColor: 'var(--us-border)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.16em]"
                    style={{ color: 'var(--us-blue-dark)' }}
                  >
                    ablaut listener app
                  </p>
                  <h2 className="mt-1 text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                    Android v{latestVersion}
                  </h2>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef8f2] text-[#1a3d2e]">
                  <QRCodeIcon />
                </span>
              </div>

              <div className="mt-4 flex justify-center rounded-2xl border p-3" style={{ borderColor: 'var(--us-border)', background: 'linear-gradient(180deg, #fcfffd, #eef5f4)' }}>
                <Image
                  alt={`QR code to download ablaut Android app v${latestVersion}`}
                  className="h-auto w-full max-w-[280px] rounded-2xl"
                  height={350}
                  src={qrDataUrl}
                  unoptimized
                  width={280}
                />
              </div>

              <p className="mt-4 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
                Scan the card on your phone to download the latest ablaut Android listener app from this server.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  className="us-button-secondary inline-flex items-center gap-2 px-3 py-2 text-sm font-medium"
                  download={`ablaut-android-v${latestVersion}.png`}
                  href={qrDataUrl}
                >
                  <DownloadIcon />
                  PNG card
                </a>
                <a
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white"
                  href={downloadPageUrl}
                  style={{ backgroundColor: 'var(--us-green-dark)' }}
                >
                  <DownloadIcon />
                  Download Android app
                </a>
                <button
                  className="rounded-2xl border px-4 py-3 text-sm font-medium"
                  onClick={() => setOpen(false)}
                  style={{ borderColor: 'var(--us-border)', color: 'var(--us-green-dark)' }}
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </>
  )
}
