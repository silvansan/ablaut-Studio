import Link from '@/components/OrgLink'

import { EventTabs } from '@/components/EventTabs'
import { eventStatusChip } from '@/lib/active-status'
import type { DashboardEvent } from '@/lib/dashboard-data'

type EventWorkspaceHeaderProps = {
  canManage: boolean
  event: DashboardEvent
  eventSlug: string
  /** The Share tab does not need a link to itself. */
  hideShareAction?: boolean
}

/** Title, status and tabs shared by every event page. */
export function EventWorkspaceHeader({ canManage, event, eventSlug, hideShareAction = false }: EventWorkspaceHeaderProps) {
  const status = eventStatusChip(event.status)

  return (
    <header className="us-print-hide space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="min-w-0 truncate text-xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
          {event.title}
        </h2>
        <span className={`us-chip ${status.className}`}>{status.label}</span>
        {event.publicListenerEnabled === false ? <span className="us-chip us-chip-warning">Public listeners off</span> : null}
        {event.location ? (
          <span className="text-sm" style={{ color: 'var(--us-muted)' }}>
            {event.location}
          </span>
        ) : null}
        {hideShareAction ? null : (
          <Link className="us-button-secondary ml-auto px-3 py-1.5 text-sm font-medium" href={`/events/${eventSlug}/share`}>
            Share and print
          </Link>
        )}
      </div>
      {event.description ? (
        <p className="text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
          {event.description}
        </p>
      ) : null}
      <EventTabs canManage={canManage} eventSlug={eventSlug} />
    </header>
  )
}
