import { notFound } from 'next/navigation'

import { regeneratePrivateLinksAction, updateEventSettingsAction } from '@/app/events/actions'
import { ActionFeedbackForm } from '@/components/ActionFeedbackForm'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { EventForm } from '@/components/EventForm'
import { EventWorkspaceHeader } from '@/components/EventWorkspaceHeader'
import { Layout } from '@/components/Layout'
import { loadEventWorkspace } from '@/lib/event-workspace'
import { getManageableOrganizations } from '@/lib/organization-data'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

export default async function EventSettingsTab({ params }: PageProps) {
  const { eventSlug } = await params
  const { canManageAssignments, event, fullEvent } = await loadEventWorkspace(eventSlug)

  if (!canManageAssignments) {
    notFound()
  }

  const organizations = await getManageableOrganizations()

  return (
    <Layout
      breadcrumbs={[{ href: `/events/${eventSlug}`, label: event.title }, { label: 'Settings' }]}
      hideHeader
      title={`Settings · ${event.title}`}
    >
      <section className="space-y-4">
        <EventWorkspaceHeader canManage event={event} eventSlug={eventSlug} />
        <article className="us-panel space-y-6 px-5 py-5">
          <ActionFeedbackForm action={updateEventSettingsAction} className="space-y-5">
            <EventForm embedded event={fullEvent} organizations={organizations} submitLabel="Save event" variant="drawer" />
          </ActionFeedbackForm>

          {fullEvent.privateLinksEnabled ? (
            <form
              className="flex flex-wrap items-center justify-between gap-3 border px-4 py-4"
              id={`regenerate-private-links-${fullEvent.id}`}
              style={{ borderColor: 'var(--us-border)', borderRadius: 'var(--us-r-control)' }}
            >
              <input name="id" type="hidden" value={fullEvent.id} />
              <p className="text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
                Rotate this event&apos;s private link. Every link and QR shared so far stops working.
              </p>
              <ConfirmSubmitButton
                action={regeneratePrivateLinksAction}
                className="us-button-secondary px-3 py-1.5 text-sm font-medium"
                confirmMessage="This invalidates every listener and speaker link and QR already shared for this event. Printed QRs and saved links stop working immediately."
                formId={`regenerate-private-links-${fullEvent.id}`}
                title="Regenerate private links"
              >
                Regenerate links
              </ConfirmSubmitButton>
            </form>
          ) : null}
        </article>
      </section>
    </Layout>
  )
}
