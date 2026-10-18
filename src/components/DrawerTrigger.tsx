'use client'

import { createContext, useContext, useState, useTransition, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'

import { PlusIcon } from '@/components/ActionIcons'
import { Drawer } from '@/components/Drawer'

const DrawerCloseContext = createContext<() => void>(() => {})

type DrawerTriggerProps = {
  buttonLabel: string
  children: ReactNode
  /** `secondary` when another primary button sits nearby: one primary per view. */
  variant?: 'primary' | 'secondary'
  /** Drawer heading; defaults to the button label. */
  title?: string
}

/** A primary button that opens a drawer holding `children` (usually a `DrawerActionForm`). */
export function DrawerTrigger({ buttonLabel, children, title, variant = 'primary' }: DrawerTriggerProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className={`${variant === 'primary' ? 'us-button-primary' : 'us-button-secondary'} inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium`}
        onClick={() => setOpen(true)}
        type="button"
      >
        <PlusIcon />
        {buttonLabel}
      </button>
      <Drawer onClose={() => setOpen(false)} open={open} title={title ?? buttonLabel}>
        <DrawerCloseContext.Provider value={() => setOpen(false)}>{children}</DrawerCloseContext.Provider>
      </Drawer>
    </>
  )
}

type DrawerActionFormProps = {
  action: (formData: FormData) => Promise<void>
  children: ReactNode
  submitLabel: string
}

/**
 * A form for a server action that lives inside a `DrawerTrigger`. On success the drawer closes and
 * the page refreshes; on failure the message stays in the drawer and nothing is lost.
 */
export function DrawerActionForm({ action, children, submitLabel }: DrawerActionFormProps) {
  const close = useContext(DrawerCloseContext)
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<null | string>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setError(null)

    startTransition(async () => {
      try {
        await action(formData)
        close()
        router.refresh()
      } catch (failure) {
        setError(failure instanceof Error && failure.message ? failure.message : 'That did not save. Try again.')
      }
    })
  }

  return (
    <form aria-busy={pending} className="space-y-4" onSubmit={submit}>
      {error ? (
        <p
          className="border px-3 py-2 text-sm"
          role="alert"
          style={{ borderColor: 'var(--us-danger)', borderRadius: 'var(--us-r-control)', color: 'var(--us-danger)' }}
        >
          {error}
        </p>
      ) : null}
      {children}
      <button className="us-button-primary px-4 py-2 text-sm font-medium" disabled={pending} type="submit">
        {pending ? 'Saving...' : submitLabel}
      </button>
    </form>
  )
}
