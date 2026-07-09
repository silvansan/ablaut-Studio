'use client'

import Image from 'next/image'
import { useState } from 'react'

import { CollapseImageIcon, ExpandImageIcon } from '@/components/ActionIcons'

type QrCardPreviewProps = {
  alt: string
  qrDataUrl: string
}

export function QrCardPreview({ alt, qrDataUrl }: QrCardPreviewProps) {
  const [enlarged, setEnlarged] = useState(false)

  return (
    <div
      className="relative flex justify-center rounded-3xl border p-3 transition-all duration-200"
      style={{ borderColor: 'rgba(38, 167, 242, 0.22)', background: 'linear-gradient(180deg, #fcfffd, #eef5f4)' }}
    >
      <button
        aria-label={enlarged ? 'Show smaller QR card' : 'Show larger QR card'}
        aria-pressed={enlarged}
        className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/95 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        onClick={() => setEnlarged((current) => !current)}
        style={{ borderColor: 'var(--us-border)', color: 'var(--us-blue-dark)' }}
        title={enlarged ? 'Smaller' : 'Larger'}
        type="button"
      >
        {enlarged ? <CollapseImageIcon /> : <ExpandImageIcon />}
      </button>

      <Image
        alt={alt}
        className={`h-auto rounded-2xl transition-all duration-200 ${enlarged ? 'w-full max-w-[480px]' : 'w-full max-w-[280px]'}`}
        height={enlarged ? 600 : 350}
        src={qrDataUrl}
        unoptimized
        width={enlarged ? 480 : 280}
      />
    </div>
  )
}
