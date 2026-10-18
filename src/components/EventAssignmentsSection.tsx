import { deleteEventAssignmentAction } from '@/app/events/[eventSlug]/settings/actions'
import { TrashIcon } from '@/components/ActionIcons'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { EventAssignmentDrawer, type AssignableUserOption } from '@/components/EventAssignmentDrawer'
import { EventPermissionIcon } from '@/components/EventPermissionIcon'
import { EVENT_PERMISSIONS, EVENT_ROLES, type EventPermissions } from '@/lib/event-permissions'
import type { EventAssignment, User } from '@/payload-types'

type EventAssignmentsSectionProps = {
  assignments: EventAssignment[]
  assignableUsers: AssignableUserOption[]
  canManageAssignments: boolean
  canSetAdminRole: boolean
  eventID: number
  eventSlug: string
}

function personOf(user: number | User) {
  return typeof user === 'number'
    ? { email: '', id: user, name: `User ${user}` }
    : { email: user.email, id: user.id, name: user.name }
}

function permissionsOf(assignment: EventAssignment): EventPermissions {
  return Object.fromEntries(
    EVENT_PERMISSIONS.map((permission) => [permission.key, Boolean(assignment.permissions?.[permission.key])]),
  ) as EventPermissions
}

/** The event's team: one hairline row per person, with add and edit in a drawer. */
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

  const sorted = [...assignments].sort((a, b) => personOf(a.user).name.localeCompare(personOf(b.user).name))

  return (
    <section>
      <div className="flex items-center justify-between gap-3 pb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          Team{' '}
          <span className="font-normal" style={{ color: 'var(--us-muted)' }}>
            {sorted.length}
          </span>
        </p>
        {canManageAssignments && assignableUsers.length > 0 ? (
          <EventAssignmentDrawer
            assignableUsers={assignableUsers}
            canSetAdminRole={canSetAdminRole}
            eventID={eventID}
            eventSlug={eventSlug}
          />
        ) : null}
      </div>

      {sorted.length > 0 ? (
        <ul className="overflow-hidden border" style={{ borderColor: 'var(--us-border)', borderRadius: 'var(--us-r-control)' }}>
          {sorted.map((assignment) => {
            const person = personOf(assignment.user)
            const permissions = permissionsOf(assignment)
            const roleLabel = EVENT_ROLES.find((role) => role.value === assignment.roleForEvent)?.label ?? assignment.roleForEvent
            const removeFormId = `remove-event-assignment-${assignment.id}`

            return (
              <li className="us-list-row flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5" key={assignment.id}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                    {person.name}
                  </p>
                  <p className="truncate text-xs" style={{ color: 'var(--us-muted)' }}>
                    {person.email}
                  </p>
                </div>

                <span className={`us-chip ${assignment.roleForEvent === 'admin' ? 'us-chip-blue' : 'us-chip-muted'}`}>
                  {roleLabel}
                </span>

                <span className="inline-flex items-center gap-2" role="list">
                  {EVENT_PERMISSIONS.map((permission) => (
                    <span
                      aria-label={`${permission.label}: ${permissions[permission.key] ? 'yes' : 'no'}`}
                      className="inline-flex"
                      key={permission.key}
                      role="listitem"
                      style={{ color: permissions[permission.key] ? 'var(--us-green-dark)' : 'var(--us-border-strong)' }}
                      title={`${permission.label}: ${permissions[permission.key] ? 'yes' : 'no'}`}
                    >
                      <EventPermissionIcon permission={permission.key} />
                    </span>
                  ))}
                </span>

                {canManageAssignments ? (
                  <span className="inline-flex items-center gap-1.5">
                    <EventAssignmentDrawer
                      assignableUsers={assignableUsers}
                      canSetAdminRole={canSetAdminRole}
                      editing={{
                        permissions,
                        roleForEvent: assignment.roleForEvent,
                        userId: person.id,
                        userName: person.name,
                      }}
                      eventID={eventID}
                      eventSlug={eventSlug}
                    />
                    <form action={deleteEventAssignmentAction} id={removeFormId}>
                      <input name="assignmentID" type="hidden" value={assignment.id} />
                      <input name="eventSlug" type="hidden" value={eventSlug} />
                      <ConfirmSubmitButton
                        action={deleteEventAssignmentAction}
                        className="us-button-secondary inline-flex h-8 w-8 items-center justify-center"
                        confirmLabel="Remove"
                        confirmMessage={`Remove ${person.name} from this event?`}
                        formId={removeFormId}
                        title="Remove from event"
                        triggerLabel={`Remove ${person.name}`}
                      >
                        <TrashIcon />
                      </ConfirmSubmitButton>
                    </form>
                  </span>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
          No one yet.
        </p>
      )}
    </section>
  )
}
