import {
  deleteUserEventAssignmentAction,
  upsertUserEventAssignmentAction,
} from '@/app/users/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { ListGroupRow } from '@/components/ListGroupRow'
import { TruncatedList } from '@/components/TruncatedList'
import { assignGroupTints } from '@/lib/list-group-tints'
import type { EventAssignment } from '@/payload-types'

type AssignableEvent = {
  id: number
  slug: string
  title: string
}

type UserEventAssignmentsSectionProps = {
  assignments: EventAssignment[]
  assignableEvents: AssignableEvent[]
  canManageAssignments: boolean
  canSetAdminRole: boolean
  targetUserID: number
}

function eventTitle(event: number | { title?: string | null } | null | undefined): string {
  if (typeof event === 'number') {
    return `Event ${event}`
  }

  return event?.title ?? 'Event'
}

function eventID(event: number | { id?: number } | null | undefined): string {
  if (typeof event === 'number') {
    return String(event)
  }

  return String(event?.id ?? '__none__')
}

export function UserEventAssignmentsSection({
  assignments,
  assignableEvents,
  canManageAssignments,
  canSetAdminRole,
  targetUserID,
}: UserEventAssignmentsSectionProps) {
  const tintedAssignments = assignGroupTints(
    [...assignments].sort((a, b) => eventTitle(a.event).localeCompare(eventTitle(b.event))),
    (assignment) => eventID(assignment.event),
  )

  if (!canManageAssignments) {
    return tintedAssignments.length > 0 ? (
      <div className="mt-4 rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
          Event access
        </p>
        <TruncatedList as="ul" className="mt-3" itemLabel="assignments" listClassName="space-y-2 text-sm" >
          {tintedAssignments.map((assignment) => (
            <ListGroupRow as="li" key={assignment.id} rowTint={assignment.rowTint} style={{ color: 'var(--us-muted)' }}>
              {eventTitle(assignment.event)} · <span className="capitalize">{assignment.roleForEvent}</span>
            </ListGroupRow>
          ))}
        </TruncatedList>
      </div>
    ) : null
  }

  return (
    <div className="mt-4 rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
        Event access
      </p>
      <p className="mt-2 text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
        Assign this user to events and set moderator permissions.
      </p>

      {tintedAssignments.length > 0 ? (
        <TruncatedList className="mt-4" itemLabel="assignments" listClassName="space-y-3">
          {tintedAssignments.map((assignment) => (
            <ListGroupRow
              className="rounded-2xl px-4 py-3 text-sm"
              key={assignment.id}
              rowTint={assignment.rowTint}
              style={{ color: 'var(--us-text)' }}
            >
              <p className="font-semibold">{eventTitle(assignment.event)}</p>
              <p className="mt-1 capitalize" style={{ color: 'var(--us-muted)' }}>
                {assignment.roleForEvent} · edit {assignment.permissions?.canEditEvent ? 'yes' : 'no'} · channels{' '}
                {assignment.permissions?.canCreateChannels ? 'create' : ''}
                {assignment.permissions?.canDeleteChannels ? '/delete' : ''}
              </p>
              <form action={deleteUserEventAssignmentAction} className="mt-3" id={`remove-assignment-${assignment.id}`}>
                <input name="assignmentID" type="hidden" value={assignment.id} />
                <ConfirmSubmitButton
                  action={deleteUserEventAssignmentAction}
                  className="rounded-2xl border px-3 py-2 text-xs font-medium"
                  confirmMessage="Remove this user from the event?"
                  formId={`remove-assignment-${assignment.id}`}
                  title="Remove event access"
                >
                  Remove
                </ConfirmSubmitButton>
              </form>
            </ListGroupRow>
          ))}
        </TruncatedList>
      ) : (
        <p className="mt-3 text-sm" style={{ color: 'var(--us-muted)' }}>
          No event assignments yet.
        </p>
      )}

      {assignableEvents.length > 0 ? (
        <form action={upsertUserEventAssignmentAction} className="mt-5 space-y-4 border-t pt-5" style={{ borderColor: 'var(--us-border)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--us-text)' }}>
            Add or update assignment
          </p>
          <input name="userID" type="hidden" value={targetUserID} />
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Event
              <select
                className="us-input mt-2"
                name="eventID"
                required
              >
                <option value="">Select event</option>
                {assignableEvents.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Event role
              <select className="us-input mt-2" name="roleForEvent" style={{ borderColor: 'var(--us-border)' }}>
                {canSetAdminRole ? <option value="admin">Admin</option> : null}
                <option value="moderator">Moderator</option>
                <option value="viewer">Viewer</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              ['canEditEvent', 'Edit event', false],
              ['canCreateChannels', 'Create channels', true],
              ['canDeleteChannels', 'Delete channels', true],
              ['canViewQR', 'View QR', true],
              ['canManageSpeakerPassword', 'Manage speaker password', true],
            ].map(([name, label, checked]) => (
              <label key={String(name)} className="flex items-start gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
                <input className="mt-1" defaultChecked={Boolean(checked)} name={String(name)} type="checkbox" />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <button type="submit" className="us-button-secondary px-5 py-3 text-sm font-medium">
            Save assignment
          </button>
        </form>
      ) : null}
    </div>
  )
}
