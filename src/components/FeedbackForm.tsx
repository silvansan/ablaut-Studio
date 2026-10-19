'use client'

import { useActionState } from 'react'

import { submitFeedbackAction, type FeedbackActionState } from '@/app/feedback/actions'
import { Field } from '@/components/FormFields'

type FeedbackFormProps = {
  defaultContactEmail?: string | null
  defaultPageUrl?: string | null
}

const initialState: FeedbackActionState = {}

export function FeedbackForm({ defaultContactEmail, defaultPageUrl }: FeedbackFormProps) {
  const [state, formAction, pending] = useActionState(submitFeedbackAction, initialState)

  if (state.success) {
    return (
      <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--us-green)', color: 'var(--us-green-dark)' }}>
        Thank you. Your feedback was sent to the ablaut team.
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <Field label="What happened?">
        <textarea
          className="us-input min-h-40"
          name="message"
          placeholder="What you tried, what you expected, and what went wrong."
          required
        />
      </Field>
      <Field hint="Only if you want a reply." label="Your email">
        <input className="us-input" defaultValue={defaultContactEmail ?? ''} name="contactEmail" type="email" />
      </Field>
      <input name="pageUrl" type="hidden" value={defaultPageUrl ?? ''} />
      {state.error ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}>
          {state.error}
        </p>
      ) : null}
      <button className="us-button-primary px-4 py-2 text-sm font-medium" disabled={pending} type="submit">
        {pending ? 'Sending...' : 'Send feedback'}
      </button>
    </form>
  )
}
