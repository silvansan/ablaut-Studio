import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { EventForm } from '@/components/EventForm'
import { Layout } from '@/components/Layout'
import { createEventAction } from '@/app/events/actions'
import { getManageableOrganizations } from '@/lib/organization-data'
import { requireAppUser } from '@/lib/app-auth'
import { canCreateEvents } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function NewEventPage() {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  if (!(await canCreateEvents({ payload, user } as never))) {
    notFound()
  }

  const organizations = await getManageableOrganizations()

  return (
    <Layout hideHeader title="Create event">
      <EventForm
        action={createEventAction}
        organizations={organizations}
        submitLabel="Create event"
      />
    </Layout>
  )
}
