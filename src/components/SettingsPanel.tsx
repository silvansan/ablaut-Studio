import type { ReactNode } from 'react'

import { Hint } from '@/components/FormFields'

type SettingsPanelProps = {
  /** Buttons on the right of the heading. */
  actions?: ReactNode
  children?: ReactNode
  className?: string
  /** One short explanation, shown behind an info icon next to the title. */
  hint?: string
  title: string
}

/** One card of a settings or profile page: a small heading over its form. */
export function SettingsPanel({ actions, children, className = '', hint, title }: SettingsPanelProps) {
  return (
    <article className={`us-panel space-y-4 px-6 py-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="inline-flex items-center gap-1.5 text-base font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          {title}
          {hint ? <Hint text={hint} /> : null}
        </h3>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </article>
  )
}
