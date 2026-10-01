'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

import { ModalPortal } from '@/components/ModalPortal'

type ConfirmSubmitButtonProps = {
  action: (formData: FormData) => Promise<void>
  children: string
  className?: string
  confirmMessage: string
  formId: string
  successUrl?: string
  title?: string
}

function actionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return 'The action could not be completed. Please try again.'
}

export function ConfirmSubmitButton({
  action,
  children,
  className,
  confirmMessage,
  formId,
  successUrl,
  title = 'Confirm delete',
}: ConfirmSubmitButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function confirmDelete() {
    const form = document.getElementById(formId)

    if (!(form instanceof HTMLFormElement)) {
      setErrorMessage('Could not find the form to submit. Refresh the page and try again.')
      return
    }

    setOpen(false)
    setErrorMessage(null)

    startTransition(async () => {
      try {
        await action(new FormData(form))

        if (successUrl) {
          router.replace(successUrl)
        }

        router.refresh()
      } catch (error) {
        setErrorMessage(actionErrorMessage(error))
      }
    })
  }

  return (
    <>
      <div className="flex flex-col items-end gap-2">
        <button
          className={className ?? 'rounded-2xl border px-4 py-2.5 text-sm font-medium'}
          disabled={isPending}
          onClick={() => {
            setErrorMessage(null)
            setOpen(true)
          }}
          style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}
          type="button"
        >
          {children}
        </button>
        {errorMessage ? (
          <p className="max-w-xs text-right text-xs leading-5" role="alert" style={{ color: 'var(--us-danger)' }}>
            {errorMessage}
          </p>
        ) : null}
      </div>

      {open ? (
        <ModalPortal>
          <div
            aria-label={title}
            aria-modal="true"
            className="us-scrim fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
            onClick={() => setOpen(false)}
            role="dialog"
          >
            <div
              className="us-modal-card w-full max-w-sm p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-danger)' }}>
                Dangerous action
              </p>
              <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                {title}
              </h2>
              <p className="mt-3 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
                {confirmMessage}
              </p>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" onClick={() => setOpen(false)} type="button">
                  Cancel
                </button>
                <button
                  className="rounded-2xl border px-4 py-2.5 text-sm font-medium"
                  disabled={isPending}
                  onClick={confirmDelete}
                  style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}
                  type="button"
                >
                  {isPending ? 'Deleting…' : children}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      ) : null}
    </>
  )
}
