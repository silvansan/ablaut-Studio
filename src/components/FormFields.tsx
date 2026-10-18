import type { ReactNode } from 'react'

import { InfoIcon } from '@/components/ActionIcons'

/** A short explanation that stays out of the way: shown on hover or focus of an info icon. */
export function Hint({ text }: { text: string }) {
  return (
    <span aria-label={text} className="us-hint" role="img" tabIndex={0} title={text}>
      <InfoIcon />
    </span>
  )
}

type FieldProps = {
  children: ReactNode
  className?: string
  hint?: string
  label: string
}

/** Compact labelled control. Put a `us-input` (input, select, textarea) inside. */
export function Field({ children, className = '', hint, label }: FieldProps) {
  return (
    <label className={`us-field ${className}`}>
      <span className="us-field__label">
        {label}
        {hint ? <Hint text={hint} /> : null}
      </span>
      {children}
    </label>
  )
}

type SwitchFieldProps = {
  defaultChecked?: boolean
  disabled?: boolean
  hint?: string
  label: string
  name: string
  /** A one-line consequence worth reading before flipping the switch. */
  note?: string
}

/** A labelled on/off row. Consecutive rows are divided by a hairline. */
export function SwitchField({ defaultChecked = false, disabled = false, hint, label, name, note }: SwitchFieldProps) {
  return (
    <div>
      <label className="us-switch-row">
        <span className="inline-flex items-center gap-1.5 font-medium">
          {label}
          {hint ? <Hint text={hint} /> : null}
        </span>
        <span className="us-neu-toggle us-neu-toggle--sm us-neu-toggle--green">
          <input className="us-neu-toggle-input" defaultChecked={defaultChecked} disabled={disabled} name={name} type="checkbox" />
          <span aria-hidden className="us-neu-toggle-track">
            <span className="us-neu-toggle-thumb" />
          </span>
        </span>
      </label>
      {note ? (
        <p className="-mt-1 pb-2 text-xs" style={{ color: 'var(--us-muted)' }}>
          {note}
        </p>
      ) : null}
    </div>
  )
}

type FormSectionProps = {
  children: ReactNode
  defaultOpen?: boolean
  title: string
}

/** Flat, collapsible group for the options most people never touch. */
export function FormSection({ children, defaultOpen = false, title }: FormSectionProps) {
  return (
    <details className="us-section" open={defaultOpen}>
      <summary className="us-section__summary">
        {title}
        <span aria-hidden="true" className="us-section__chevron">
          ▾
        </span>
      </summary>
      <div className="us-section__body">{children}</div>
    </details>
  )
}
