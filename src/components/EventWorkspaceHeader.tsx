import Link from '@/components/OrgLink'

import { EventTabs } from '@/components/EventTabs'
import { WorkspaceHeader } from '@/components/WorkspaceHeader'
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
    <WorkspaceHeader
      actions={
        hideShareAction ? null : (
          <Link className="us-button-secondary px-3 py-1.5 text-sm font-medium" href={`/events/${eventSlug}/share`}>
            Share and print
          </Link>
        )
      }
      chips={
        <>
          <span className={`us-chip ${status.className}`}>{status.label}</span>
          {event.publicListenerEnabled === false ? <span className="us-chip us-chip-warning">Public listeners off</span> : null}
          {event.location ? (
            <span className="text-sm" style={{ color: 'var(--us-muted)' }}>
              {event.location}
            </span>
          ) : null}
        </>
      }
      description={event.description}
      title={event.title}
    >
      <EventTabs canManage={canManage} eventSlug={eventSlug} />
    </WorkspaceHeader>
  )
}
