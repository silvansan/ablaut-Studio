'use client'

import { useFormStatus } from 'react-dom'

type SubmitButtonProps = {
  className?: string
  idleLabel: string
  pendingLabel: string
}

/** Secondary-styled submit that disables itself while its parent form action is running. */
export function SubmitButton({
  className = 'us-button-secondary px-4 py-2.5 text-sm font-medium',
  idleLabel,
  pendingLabel,
}: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <button aria-busy={pending} className={className} disabled={pending} type="submit">
      {pending ? pendingLabel : idleLabel}
    </button>
  )
}
