import {
  deleteEventAssignmentAction,
  upsertEventAssignmentAction,
} from '@/app/events/[eventSlug]/settings/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { ListGroupRow } from '@/components/ListGroupRow'
import { TruncatedList } from '@/components/TruncatedList'
import { assignGroupTints } from '@/lib/list-group-tints'
import type { EventAssignment, User } from '@/payload-types'

type AssignableUser = {
  email: string
  id: number
  membershipStatus?: string | null
  name: string
  role?: string | null
}

type EventAssignmentsSectionProps = {
  assignments: EventAssignment[]
  assignableUsers: AssignableUser[]
  canManageAssignments: boolean
  canSetAdminRole: boolean
  eventID: number
  eventSlug: string
}

function userLabel(user: number | User): string {
  if (typeof user === 'number') {
    return `User ${user}`
  }

  return `${user.name} (${user.email})`
}

function userRole(user: number | User): string {
  return typeof user === 'number' ? 'unknown' : user.role
}

export function EventAssignmentsSection({
  assignments,
  assignableUsers,
  canManageAssignments,
  canSetAdminRole,
  eventID,
  eventSlug,
}: EventAssignmentsSectionProps) {
  if (assignments.length === 0 && !canManageAssignments) {
    return null
  }

  const tintedAssignments = assignGroupTints(
    [...assignments].sort((a, b) => {
      const roleCompare = String(a.roleForEvent ?? '').localeCompare(String(b.roleForEvent ?? ''))

      if (roleCompare !== 0) {
        return roleCompare
      }

      return userLabel(a.user).localeCompare(userLabel(b.user))
    }),
    (assignment) => String(assignment.roleForEvent ?? '__none__'),
  )

  return (
    <div className="rounded-2xl border px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
          Team assignments
        </p>
      </div>

      {tintedAssignments.length > 0 ? (
        <TruncatedList className="mt-4" itemLabel="assignments" listClassName="space-y-3">
          {tintedAssignments.map((assignment) => (
            <ListGroupRow
              className="rounded-2xl px-4 py-3 text-sm"
              key={assignment.id}
              rowTint={assignment.rowTint}
              style={{ color: 'var(--us-text)' }}
            >
              <p className="font-semibold">{userLabel(assignment.user)}</p>
              <p className="mt-1 capitalize" style={{ color: 'var(--us-muted)' }}>
                {assignment.roleForEvent} · user role {userRole(assignment.user)}
              </p>
              {canManageAssignments ? (
                <form action={deleteEventAssignmentAction} className="mt-3" id={`remove-event-assignment-${assignment.id}`}>
                  <input name="assignmentID" type="hidden" value={assignment.id} />
                  <input name="eventSlug" type="hidden" value={eventSlug} />
                  <ConfirmSubmitButton
                    action={deleteEventAssignmentAction}
                    className="rounded-2xl border px-3 py-2 text-xs font-medium"
                    confirmMessage="Remove this user from the event?"
                    formId={`remove-event-assignment-${assignment.id}`}
                    title="Remove event access"
                  >
                    Remove
                  </ConfirmSubmitButton>
                </form>
              ) : null}
            </ListGroupRow>
          ))}
        </TruncatedList>
      ) : (
        <p className="mt-3 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
          No users are assigned yet.
        </p>
      )}

      {canManageAssignments ? (
        assignableUsers.length > 0 ? (
          <form action={upsertEventAssignmentAction} className="mt-5 space-y-4 border-t pt-5" style={{ borderColor: 'var(--us-border)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Add or update assignment
            </p>
            <input name="eventID" type="hidden" value={eventID} />
            <input name="eventSlug" type="hidden" value={eventSlug} />
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                User
                <select
                  className="us-input mt-2"
                  name="userID"
                  required
                >
                  <option value="">Select user</option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}){user.membershipStatus === 'pending' ? ' - pending invite' : ''}
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
        ) : (
          <p className="mt-4 border-t pt-4 text-sm leading-6" style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}>
            No organization users are available to assign yet.
          </p>
        )
      ) : null}
    </div>
  )
}
