'use client'

import { PrinterIcon } from '@/components/ActionIcons'

type PrintShareButtonProps = {
  className?: string
  label?: string
}

export function PrintShareButton({
  className = 'us-button-primary px-4 py-2.5 text-sm font-medium',
  label = 'Print',
}: PrintShareButtonProps) {
  return (
    <button className={`${className} inline-flex items-center gap-1.5`} onClick={() => window.print()} type="button">
      <PrinterIcon />
      {label}
    </button>
  )
}
