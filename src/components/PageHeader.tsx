import type { ReactNode } from 'react'

/** The heading line of a page: title on the left, its main actions on the right. */
export function PageHeader({ actions, title }: { actions?: ReactNode; title: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
        {title}
      </h2>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
