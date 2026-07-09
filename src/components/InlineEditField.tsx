'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { useActionFeedback } from '@/components/AppToastProvider'
import { PencilIcon } from '@/components/ActionIcons'
import type { ActionFeedbackHandler } from '@/lib/action-feedback'

type InlineEditFieldProps = {
  action: ActionFeedbackHandler
  children: ReactNode
  fieldName: string
  hiddenFields: Record<string, number | string>
  inputLabel: string
  multiline?: boolean
  placeholder?: string
  value: string
}

export function InlineEditField({
  action,
  children,
  fieldName,
  hiddenFields,
  inputLabel,
  multiline = false,
  placeholder,
  value,
}: InlineEditFieldProps) {
  const [editing, setEditing] = useState(false)
  const { formAction, state } = useActionFeedback(action)

  useEffect(() => {
    if (editing && state.ok && state.message) {
      setEditing(false)
    }
  }, [editing, state])

  if (editing) {
    return (
      <form action={formAction} className="space-y-3">
        {Object.entries(hiddenFields).map(([key, hiddenValue]) => (
          <input key={key} name={key} type="hidden" value={hiddenValue} />
        ))}
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          {inputLabel}
          {multiline ? (
            <textarea
              className="mt-2 min-h-24 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
              defaultValue={value}
              name={fieldName}
              placeholder={placeholder}
              style={{ borderColor: 'var(--us-border)' }}
            />
          ) : (
            <input
              className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
              defaultValue={value}
              name={fieldName}
              placeholder={placeholder}
              required
              style={{ borderColor: 'var(--us-border)' }}
            />
          )}
        </label>
        <div className="flex flex-wrap gap-2">
          <button className="us-button-primary px-4 py-2.5 text-sm font-medium" type="submit">
            Save
          </button>
          <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" onClick={() => setEditing(false)} type="button">
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="group flex items-start gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      <button
        aria-label={`Edit ${inputLabel.toLowerCase()}`}
        className="mt-1 inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border bg-white/80 opacity-80 transition hover:-translate-y-0.5 hover:opacity-100 hover:shadow-md"
        onClick={() => setEditing(true)}
        style={{ borderColor: 'var(--us-border)', color: 'var(--us-blue-dark)' }}
        type="button"
      >
        <PencilIcon />
      </button>
    </div>
  )
}
