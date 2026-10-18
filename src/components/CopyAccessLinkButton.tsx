'use client'

import { useState, useTransition } from 'react'

import { createAccessLinkForUserAction } from '@/app/users/actions'
import { useAppToast } from '@/components/AppToastProvider'
import { errorFeedback, successFeedback } from '@/lib/action-feedback'

type CopyAccessLinkButtonProps = {
  label: string
  organizationId?: number
  userId: number | string
}

/**
 * Mints a fresh one-time set-password link and copies it, so an admin can hand it over
 * in person or by chat. This is the fallback for servers without SMTP and for mail that
 * never arrives. If the browser blocks clipboard access the link is shown to copy by hand.
 */
export function CopyAccessLinkButton({ label, organizationId, userId }: CopyAccessLinkButtonProps) {
  const { showToast } = useAppToast()
  const [pending, startTransition] = useTransition()
  const [manualUrl, setManualUrl] = useState<null | string>(null)

  function handleClick() {
    startTransition(async () => {
      const result = await createAccessLinkForUserAction({ organizationId, userId })

      if (!result.ok || !result.url) {
        showToast(result.ok ? errorFeedback('The link could not be created.') : result)
        return
      }

      try {
        await navigator.clipboard.writeText(result.url)
        setManualUrl(null)
        showToast(result)
      } catch {
        setManualUrl(result.url)
        showToast(successFeedback('Link created. Your browser blocked copying, so copy it from the field below.'))
      }
    })
  }

  return (
    <div className="space-y-2">
      <button
        aria-busy={pending}
        className="us-button-secondary px-4 py-2.5 text-sm font-medium"
        disabled={pending}
        onClick={handleClick}
        type="button"
      >
        {pending ? 'Creating link...' : label}
      </button>
      {manualUrl ? (
        <input
          aria-label="One-time link"
          className="w-full rounded-2xl border bg-white px-3 py-2 text-xs"
          onFocus={(event) => event.currentTarget.select()}
          readOnly
          style={{ borderColor: 'var(--us-border)' }}
          value={manualUrl}
        />
      ) : null}
    </div>
  )
}
