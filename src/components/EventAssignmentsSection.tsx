import { deleteEventAssignmentAction } from '@/app/events/[eventSlug]/settings/actions'
import { EventAssignmentDrawer, type AssignableUserOption } from '@/components/EventAssignmentDrawer'
import { EventPermissionIcon } from '@/components/EventPermissionIcon'
import { ShieldIcon } from '@/components/ActionIcons'
import { Chip, ChipGrid, DeleteIconButton, ListBody, ListEmpty, ListPanel, ListRow, RowTitle } from '@/components/ListKit'
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

/** The event's team. Add and edit open in a drawer. */
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
    <ListPanel
      actions={
        canManageAssignments && assignableUsers.length > 0 ? (
          <EventAssignmentDrawer
            assignableUsers={assignableUsers}
            canSetAdminRole={canSetAdminRole}
            eventID={eventID}
            eventSlug={eventSlug}
          />
        ) : null
      }
      count={sorted.length}
      title="Team"
    >
      {sorted.length > 0 ? (
        <ListBody itemLabel="people">
          {sorted.map((assignment) => {
            const person = personOf(assignment.user)
            const permissions = permissionsOf(assignment)
            const roleLabel = EVENT_ROLES.find((role) => role.value === assignment.roleForEvent)?.label ?? assignment.roleForEvent

            return (
              <ListRow
                actions={
                  canManageAssignments ? (
                    <>
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
                      <DeleteIconButton
                        action={deleteEventAssignmentAction}
                        confirmLabel="Remove"
                        confirmMessage={`Remove ${person.name} from this event?`}
                        fields={{ assignmentID: assignment.id, eventSlug }}
                        label={`Remove ${person.name}`}
                        title="Remove from event"
                      />
                    </>
                  ) : null
                }
                chips={
                  <ChipGrid columns="6.5rem 9rem">
                    <Chip icon={<ShieldIcon />} title="Role in this event" tone={assignment.roleForEvent === 'admin' ? 'blue' : 'muted'}>
                      {roleLabel}
                    </Chip>
                    <span className="inline-flex items-center gap-2" role="list">
                      {EVENT_PERMISSIONS.map((permission) => {
                        const granted = Boolean(assignment.permissions?.[permission.key])

                        return (
                          <span
                            aria-label={`${permission.label}: ${granted ? 'yes' : 'no'}`}
                            className="inline-flex"
                            key={permission.key}
                            role="listitem"
                            style={{ color: granted ? 'var(--us-green-dark)' : 'var(--us-border-strong)' }}
                            title={`${permission.label}: ${granted ? 'yes' : 'no'}`}
                          >
                            <EventPermissionIcon permission={permission.key} />
                          </span>
                        )
                      })}
                    </span>
                  </ChipGrid>
                }
                key={assignment.id}
                lead={<RowTitle subtitle={person.email} title={person.name} />}
              />
            )
          })}
        </ListBody>
      ) : (
        <ListEmpty>No one yet.</ListEmpty>
      )}
    </ListPanel>
  )
}
