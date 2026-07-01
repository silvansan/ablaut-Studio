'use client'

import { useActionState } from 'react'

import { submitFeedbackAction, type FeedbackActionState } from '@/app/feedback/actions'

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
      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        What happened?
        <textarea
          className="mt-2 min-h-40 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
          name="message"
          placeholder="Describe what you tried, what you expected, and what went wrong."
          required
          style={{ borderColor: 'var(--us-border)' }}
        />
      </label>
      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
        Contact email (optional)
        <input
          className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
          defaultValue={defaultContactEmail ?? ''}
          name="contactEmail"
          placeholder="Where we can reply"
          style={{ borderColor: 'var(--us-border)' }}
          type="email"
        />
      </label>
      <input name="pageUrl" type="hidden" value={defaultPageUrl ?? ''} />
      {state.error ? (
        <p className="rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}>
          {state.error}
        </p>
      ) : null}
      <button className="us-button-primary w-full px-5 py-3 text-sm font-medium" disabled={pending} type="submit">
        {pending ? 'Sending...' : 'Send feedback'}
      </button>
    </form>
  )
}
