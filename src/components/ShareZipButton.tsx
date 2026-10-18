'use client'

import { useCallback } from 'react'

import { DownloadIcon } from '@/components/ActionIcons'

type ShareZipButtonProps = {
  className?: string
  eventSlug: string
  label?: string
}

export function ShareZipButton({
  className = 'us-button-secondary px-4 py-2.5 text-sm font-medium',
  eventSlug,
  label = 'Download all PNGs (ZIP)',
}: ShareZipButtonProps) {
  const downloadZip = useCallback(() => {
    window.location.assign(`/api/events/${encodeURIComponent(eventSlug)}/qr-zip`)
  }, [eventSlug])

  return (
    <button className={`${className} inline-flex items-center gap-1.5`} onClick={downloadZip} type="button">
      <DownloadIcon />
      {label}
    </button>
  )
}
