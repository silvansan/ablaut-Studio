import { updateEventSettingsAction } from '@/app/events/actions'
import { EventAssignmentsSection } from '@/components/EventAssignmentsSection'
import { ActionFeedbackForm } from '@/components/ActionFeedbackForm'
import { EventForm } from '@/components/EventForm'
import { PanelDrawer } from '@/components/PanelDrawer'
import type { Event, EventAssignment } from '@/payload-types'

type AssignableUser = {
  email: string
  id: number
  membershipStatus?: string | null
  name: string
  role?: string | null
}

type EventSettingsDrawerProps = {
  assignments: EventAssignment[]
  assignableUsers: AssignableUser[]
  canManageAssignments: boolean
  canSetAdminRole: boolean
  defaultOpen?: boolean
  event: Event
  organizations?: Array<{ id: number; name: string; slug?: string }>
}

export function EventSettingsDrawer({
  assignments,
  assignableUsers,
  canManageAssignments,
  canSetAdminRole,
  defaultOpen = false,
  event,
  organizations = [],
}: EventSettingsDrawerProps) {
  return (
    <PanelDrawer
      defaultOpen={defaultOpen}
      description="Event details, passwords, and team list."
      title="Settings"
    >
      <div className="space-y-6">
        <ActionFeedbackForm action={updateEventSettingsAction} className="space-y-5">
          <EventForm embedded event={event} organizations={organizations} submitLabel="Save event" variant="drawer" />
        </ActionFeedbackForm>
        <EventAssignmentsSection
          assignments={assignments}
          assignableUsers={assignableUsers}
          canManageAssignments={canManageAssignments}
          canSetAdminRole={canSetAdminRole}
          eventID={event.id}
          eventSlug={event.slug}
        />
      </div>
    </PanelDrawer>
  )
}
