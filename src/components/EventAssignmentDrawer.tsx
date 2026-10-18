'use client'

import { useEffect, useRef, useState } from 'react'

import { saveEventAssignmentFeedbackAction } from '@/app/events/[eventSlug]/settings/actions'
import { PencilIcon, PlusIcon } from '@/components/ActionIcons'
import { useActionFeedback } from '@/components/AppToastProvider'
import { Drawer } from '@/components/Drawer'
import { EventPermissionIcon } from '@/components/EventPermissionIcon'
import { EVENT_PERMISSIONS, EVENT_ROLES, type EventPermissions, type EventRole } from '@/lib/event-permissions'

export type AssignableUserOption = {
  email: string
  id: number
  membershipStatus?: string | null
  name: string
}

export type EditableAssignment = {
  permissions: EventPermissions
  roleForEvent: EventRole
  userId: number
  userName: string
}

type EventAssignmentDrawerProps = {
  assignableUsers: AssignableUserOption[]
  canSetAdminRole: boolean
  /** Present when editing someone who is already on the team. */
  editing?: EditableAssignment
  eventID: number
  eventSlug: string
}

export function EventAssignmentDrawer({
  assignableUsers,
  canSetAdminRole,
  editing,
  eventID,
  eventSlug,
}: EventAssignmentDrawerProps) {
  const [open, setOpen] = useState(false)
  const { formAction, pending, state } = useActionFeedback(saveEventAssignmentFeedbackAction)
  const handled = useRef<typeof state | null>(null)

  useEffect(() => {
    if (state.ok && state.message && handled.current !== state) {
      handled.current = state
      setOpen(false)
    }
  }, [state])

  const roles = EVENT_ROLES.filter((role) => canSetAdminRole || role.value !== 'admin')

  return (
    <>
      {editing ? (
        <button
          aria-label={`Edit access for ${editing.userName}`}
          className="us-button-secondary inline-flex h-8 w-8 items-center justify-center"
          onClick={() => setOpen(true)}
          title="Edit access"
          type="button"
        >
          <PencilIcon />
        </button>
      ) : (
        <button
          className="us-button-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
          onClick={() => setOpen(true)}
          type="button"
        >
          <PlusIcon />
          Add person
        </button>
      )}

      <Drawer onClose={() => setOpen(false)} open={open} title={editing ? `Access · ${editing.userName}` : 'Add person'}>
        <form action={formAction} aria-busy={pending} className="space-y-5">
          {state.message && !state.ok ? (
            <p className="border px-3 py-2 text-sm" role="alert" style={{ borderColor: 'var(--us-danger)', borderRadius: 'var(--us-r-control)', color: 'var(--us-danger)' }}>
              {state.message}
            </p>
          ) : null}
          <input name="eventID" type="hidden" value={eventID} />
          <input name="eventSlug" type="hidden" value={eventSlug} />

          {editing ? (
            <input name="userID" type="hidden" value={editing.userId} />
          ) : (
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Person
              <select className="us-input mt-2" name="userID" required>
                <option value="">Choose a person</option>
                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}){user.membershipStatus === 'pending' ? ' · invited' : ''}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
            Role
            <select className="us-input mt-2" defaultValue={editing?.roleForEvent ?? 'moderator'} name="roleForEvent">
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="mb-2 text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Can
            </legend>
            <div className="flex flex-wrap gap-2">
              {EVENT_PERMISSIONS.map((permission) => (
                <label className="us-perm" key={permission.key}>
                  <input
                    defaultChecked={editing ? editing.permissions[permission.key] : permission.defaultOn}
                    name={permission.key}
                    type="checkbox"
                  />
                  <EventPermissionIcon permission={permission.key} />
                  {permission.label}
                </label>
              ))}
            </div>
          </fieldset>

          <button className="us-button-primary px-4 py-2 text-sm font-medium" type="submit">
            {pending ? 'Saving...' : editing ? 'Save' : 'Add'}
          </button>
        </form>
      </Drawer>
    </>
  )
}
