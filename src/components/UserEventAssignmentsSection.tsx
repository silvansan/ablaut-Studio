import { deleteUserEventAssignmentAction, upsertUserEventAssignmentAction } from '@/app/users/actions'
import { DrawerActionForm, DrawerTrigger } from '@/components/DrawerTrigger'
import { EventPermissionFields } from '@/components/EventPermissionFields'
import { EventPermissionIcon } from '@/components/EventPermissionIcon'
import { Field } from '@/components/FormFields'
import { ShieldIcon } from '@/components/ActionIcons'
import { Chip, ChipGrid, DeleteIconButton, ListBody, ListEmpty, ListPanel, ListRow, RowTitle } from '@/components/ListKit'
import { EVENT_PERMISSIONS, EVENT_ROLES } from '@/lib/event-permissions'
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

function eventTitle(event: EventAssignment['event']): string {
  return typeof event === 'number' ? `Event ${event}` : (event?.title ?? 'Event')
}

export function UserEventAssignmentsSection({
  assignments,
  assignableEvents,
  canManageAssignments,
  canSetAdminRole,
  targetUserID,
}: UserEventAssignmentsSectionProps) {
  const sorted = [...assignments].sort((a, b) => eventTitle(a.event).localeCompare(eventTitle(b.event)))

  if (!canManageAssignments && sorted.length === 0) {
    return null
  }

  const roles = EVENT_ROLES.filter((role) => canSetAdminRole || role.value !== 'admin')

  return (
    <ListPanel
      actions={
        canManageAssignments && assignableEvents.length > 0 ? (
          <DrawerTrigger buttonLabel="Add to event">
            <DrawerActionForm action={upsertUserEventAssignmentAction} submitLabel="Save">
              <input name="userID" type="hidden" value={targetUserID} />
              <Field label="Event">
                <select className="us-input" name="eventID" required>
                  <option value="">Choose an event</option>
                  {assignableEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Role">
                <select className="us-input" defaultValue="moderator" name="roleForEvent">
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </Field>
              <EventPermissionFields />
            </DrawerActionForm>
          </DrawerTrigger>
        ) : null
      }
      count={sorted.length}
      title="Event access"
    >
      {sorted.length > 0 ? (
        <ListBody itemLabel="events">
          {sorted.map((assignment) => {
            const roleLabel = EVENT_ROLES.find((role) => role.value === assignment.roleForEvent)?.label ?? assignment.roleForEvent

            return (
              <ListRow
                actions={
                  canManageAssignments ? (
                    <DeleteIconButton
                      action={deleteUserEventAssignmentAction}
                      confirmLabel="Remove"
                      confirmMessage="Remove this person from the event?"
                      fields={{ assignmentID: assignment.id }}
                      label={`Remove from ${eventTitle(assignment.event)}`}
                      title="Remove event access"
                    />
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
                lead={<RowTitle title={eventTitle(assignment.event)} />}
              />
            )
          })}
        </ListBody>
      ) : (
        <ListEmpty>No event access yet.</ListEmpty>
      )}
    </ListPanel>
  )
}
