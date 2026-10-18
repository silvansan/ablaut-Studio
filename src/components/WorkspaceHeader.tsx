import type { ReactNode } from 'react'

type WorkspaceHeaderProps = {
  /** Right-aligned buttons next to the title. */
  actions?: ReactNode
  /** Status chips shown after the title. */
  chips?: ReactNode
  /** Tabs or filters shown under the title. */
  children?: ReactNode
  description?: null | string
  title: string
}

/** Title, status chips, actions and tabs: the top of an event page, an organization page, and the like. */
export function WorkspaceHeader({ actions, chips, children, description, title }: WorkspaceHeaderProps) {
  return (
    <header className="us-print-hide space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="min-w-0 truncate text-xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
          {title}
        </h2>
        {chips}
        {actions ? <div className="ml-auto flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {description ? (
        <p className="text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
          {description}
        </p>
      ) : null}
      {children}
    </header>
  )
}
