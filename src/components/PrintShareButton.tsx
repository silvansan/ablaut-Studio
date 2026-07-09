'use client'

type PrintShareButtonProps = {
  className?: string
  label?: string
}

export function PrintShareButton({
  className = 'us-button-primary px-4 py-2.5 text-sm font-medium',
  label = 'Print',
}: PrintShareButtonProps) {
  return (
    <button className={className} onClick={() => window.print()} type="button">
      {label}
    </button>
  )
}
