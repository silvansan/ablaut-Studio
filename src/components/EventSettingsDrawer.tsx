import { regeneratePrivateLinksAction, updateEventSettingsAction } from '@/app/events/actions'
import { EventAssignmentsSection } from '@/components/EventAssignmentsSection'
import { ActionFeedbackForm } from '@/components/ActionFeedbackForm'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { EventForm } from '@/components/EventForm'
import { CollapsiblePanel } from '@/components/CollapsiblePanel'
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
    <CollapsiblePanel
      defaultOpen={defaultOpen}
      description="Event details, passwords, and team list."
      title="Settings"
    >
      <div className="space-y-6">
        <ActionFeedbackForm action={updateEventSettingsAction} className="space-y-5">
          <EventForm embedded event={event} organizations={organizations} submitLabel="Save event" variant="drawer" />
        </ActionFeedbackForm>
        {event.privateLinksEnabled ? (
          <form className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-4" id={`regenerate-private-links-${event.id}`} style={{ borderColor: 'var(--us-border)' }}>
            <input name="id" type="hidden" value={event.id} />
            <p className="text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
              Rotate this event&apos;s private link. Every link and QR shared so far stops working.
            </p>
            <ConfirmSubmitButton
              action={regeneratePrivateLinksAction}
              className="us-button-secondary px-4 py-2.5 text-sm font-medium"
              confirmMessage="This invalidates every listener and speaker link and QR already shared for this event. Printed QRs and saved links stop working immediately."
              formId={`regenerate-private-links-${event.id}`}
              title="Regenerate private links"
            >
              Regenerate links
            </ConfirmSubmitButton>
          </form>
        ) : null}
        <EventAssignmentsSection
          assignments={assignments}
          assignableUsers={assignableUsers}
          canManageAssignments={canManageAssignments}
          canSetAdminRole={canSetAdminRole}
          eventID={event.id}
          eventSlug={event.slug}
        />
      </div>
    </CollapsiblePanel>
  )
}
