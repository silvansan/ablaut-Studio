'use client'

import type { ReactNode } from 'react'

import { useActionFeedback } from '@/components/AppToastProvider'
import type { ActionFeedbackHandler } from '@/lib/action-feedback'

type ActionFeedbackFormProps = {
  action: ActionFeedbackHandler
  children: ReactNode
  className?: string
  id?: string
}

export function ActionFeedbackForm({ action, children, className, id }: ActionFeedbackFormProps) {
  const { formAction, pending } = useActionFeedback(action)

  return (
    <form action={formAction} aria-busy={pending} className={className} id={id}>
      {children}
    </form>
  )
}
