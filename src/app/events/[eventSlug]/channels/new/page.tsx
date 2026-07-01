import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { canManageChannels, createChannelAction } from '@/app/events/[eventSlug]/channels/actions'
import { ChannelForm } from '@/components/ChannelForm'
import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { getDashboardEvent } from '@/lib/dashboard-data'
import { eventListenerPasswordConfigured } from '@/lib/listener-password'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

export default async function NewChannelPage({ params }: PageProps) {
  const { eventSlug } = await params
  const event = await getDashboardEvent(eventSlug)

  if (!event) {
    notFound()
  }

  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const eventRecord = (
    await payload.find({
      collection: 'events',
      depth: 0,
      limit: 1,
      overrideAccess: false,
      pagination: false,
      user,
      where: {
        slug: {
          equals: eventSlug,
        },
      },
    })
  ).docs[0]

  if (!eventRecord || !(await canManageChannels(payload, user, eventRecord.id))) {
    notFound()
  }

  return (
    <Layout hideHeader title={`Add channel · ${event.title}`}>
      <ChannelForm
        action={createChannelAction}
        eventListenerPasswordConfigured={eventListenerPasswordConfigured(eventRecord)}
        eventSlug={eventSlug}
        submitLabel="Create channel"
      />
    </Layout>
  )
}
