import configPromise from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { canManageChannels } from '@/app/events/[eventSlug]/channels/actions'
import { canManageAssignment } from '@/app/events/[eventSlug]/settings/actions'
import { ChannelRow } from '@/components/ChannelRow'
import { IconActionLink } from '@/components/ActionIcons'
import { RouteActionCluster } from '@/components/RouteActionCluster'
import { TruncatedList } from '@/components/TruncatedList'
import { EventSettingsDrawer } from '@/components/EventSettingsDrawer'
import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { getDashboardChannels, getDashboardEvent } from '@/lib/dashboard-data'
import { assignGroupTints } from '@/lib/list-group-tints'
import { getEventListenerUrl, getListenerUrl, getRequestBaseUrl, getSpeakerUrl } from '@/lib/links'
import { getManageableOrganizations } from '@/lib/organization-data'
import { isSuperAdminUser } from '@/lib/permissions'
import { generateQrDataUrl } from '@/lib/qrcode'
import type { OrganizationMembership, User } from '@/payload-types'

type PageProps = {
  params: Promise<{ eventSlug: string }>
  searchParams: Promise<{ settings?: string }>
}

export const dynamic = 'force-dynamic'

type AssignableUser = {
  email: string
  id: number
  membershipStatus?: string | null
  name: string
  role?: string | null
}

function userFromMembership(membership: OrganizationMembership): User | null {
  return typeof membership.user === 'number' ? null : membership.user
}

async function getAssignableUsersForEvent(
  payload: Awaited<ReturnType<typeof getPayload>>,
  currentUser: User,
  organizationID?: number | null,
): Promise<AssignableUser[]> {
  if (!organizationID) {
    return []
  }

  const memberships = await payload.find({
    collection: 'organization-memberships',
    depth: 1,
    limit: 500,
    overrideAccess: false,
    pagination: false,
    sort: 'status',
    user: currentUser,
    where: {
      and: [
        {
          organization: {
            equals: organizationID,
          },
        },
        {
          status: {
            in: ['active', 'pending'],
          },
        },
      ],
    },
  })

  const canAssignAnyRole = isSuperAdminUser(currentUser)
  const usersByID = new Map<number, AssignableUser>()

  for (const membership of memberships.docs) {
    const member = userFromMembership(membership)

    if (!member) {
      continue
    }

    if (!canAssignAnyRole && member.role !== 'moderator') {
      continue
    }

    usersByID.set(member.id, {
      email: member.email,
      id: member.id,
      membershipStatus: membership.status,
      name: member.name,
      role: member.role,
    })
  }

  return [...usersByID.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventSlug } = await params
  const event = await getDashboardEvent(eventSlug)

  return {
    title: event?.title ?? eventSlug,
  }
}

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { eventSlug } = await params
  const { settings } = await searchParams
  const [event, channels, organizations] = await Promise.all([
    getDashboardEvent(eventSlug),
    getDashboardChannels(eventSlug),
    getManageableOrganizations(),
  ])

  if (!event) {
    notFound()
  }

  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const [eventRecord, assignments, canManageAssignments] = await Promise.all([
    payload.find({
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
    }),
    payload.find({
      collection: 'event-assignments',
      depth: 1,
      limit: 100,
      overrideAccess: false,
      pagination: false,
      sort: 'roleForEvent',
      user,
      where: {
        event: {
          equals: event.id,
        },
      },
    }),
    canManageAssignment(payload, user, event.id),
  ])
  const fullEvent = eventRecord.docs[0]

  if (!fullEvent) {
    notFound()
  }

  const assignableUsers = canManageAssignments
    ? await getAssignableUsersForEvent(payload, user, event.organizationId)
    : []
  const publicBaseUrl = await getRequestBaseUrl()
  const canManageChannelsUser = await canManageChannels(payload, user, event.id)
  const eventListenerUrl = getEventListenerUrl(eventSlug, publicBaseUrl)
  const eventListenerQrDataUrl =
    fullEvent.unifiedListenerQrEnabled === true ? await generateQrDataUrl(eventListenerUrl) : null
  const sortedChannels = [...channels].sort((a, b) => a.name.localeCompare(b.name))
  const tintedChannels = assignGroupTints(sortedChannels, () => eventSlug)
  const channelRows = await Promise.all(
    tintedChannels.map(async (channel) => {
      const listenerUrl = getListenerUrl(eventSlug, channel.slug, publicBaseUrl)
      const speakerUrl = getSpeakerUrl(eventSlug, channel.slug, publicBaseUrl)
      const [listenerQrDataUrl, speakerQrDataUrl] = await Promise.all([
        generateQrDataUrl(listenerUrl),
        generateQrDataUrl(speakerUrl),
      ])

      return {
        channel,
        listenerQrDataUrl,
        listenerUrl,
        rowTint: channel.rowTint,
        speakerQrDataUrl,
        speakerUrl,
      }
    }),
  )

  return (
    <Layout hideHeader title={event.title}>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="us-chip us-chip-muted capitalize">{event.status ?? 'draft'}</span>
          <span className="us-chip us-chip-blue">
            {event.channelCount} {event.channelCount === 1 ? 'channel' : 'channels'}
          </span>
          {event.location ? <span className="us-chip us-chip-muted">{event.location}</span> : null}
          {event.publicListenerEnabled === false ? (
            <span className="us-chip us-chip-warning">Public listeners off</span>
          ) : null}
          <Link className="us-button-secondary ml-auto px-3 py-2 text-sm font-medium" href={`/channels?event=${eventSlug}`}>
            All channels
          </Link>
        </div>

        {event.description ? (
          <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            {event.description}
          </p>
        ) : null}

        {canManageAssignments ? (
          <EventSettingsDrawer
            assignments={assignments.docs}
            assignableUsers={assignableUsers}
            canManageAssignments={canManageAssignments}
            canSetAdminRole={isSuperAdminUser(user)}
            defaultOpen={settings === 'open'}
            event={fullEvent}
            organizations={organizations}
          />
        ) : null}

        {fullEvent.unifiedListenerQrEnabled ? (
          <article className="us-panel px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Event listener QR
            </p>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
              Print this QR when you want one code for all channels. Listeners choose a channel after scanning.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {eventListenerQrDataUrl ? (
                <RouteActionCluster
                  openLabel="Open event listener page"
                  qrDataUrl={eventListenerQrDataUrl}
                  qrFileName={`${eventSlug}-event-listener.png`}
                  qrLabel={`${event.title} listener directory`}
                  qrTriggerLabel="Show event listener QR"
                  url={eventListenerUrl}
                  variant="listener"
                />
              ) : (
                <IconActionLink href={eventListenerUrl} icon="open" target="_blank">
                  Open event listener page
                </IconActionLink>
              )}
            </div>
          </article>
        ) : null}

        <article className="us-panel px-5 py-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Channels
            </p>
            {canManageChannelsUser ? (
              <Link href={`/events/${eventSlug}/channels/new`} className="us-button-primary px-4 py-2.5 text-sm font-medium">
                Add channel
              </Link>
            ) : null}
          </div>

          {channelRows.length > 0 ? (
            <TruncatedList as="ul" className="mt-5" itemLabel="channels" listClassName="space-y-2">
              {channelRows.map((item) => (
                  <ChannelRow
                    canDelete={canManageChannelsUser}
                    channelId={item.channel.id}
                    description={item.channel.description}
                    enabled={item.channel.enabled}
                    eventSlug={eventSlug}
                    key={item.channel.slug}
                    listenerPageEnabled={item.channel.listenerPageEnabled}
                    listenerQrDataUrl={item.listenerQrDataUrl}
                    listenerUrl={item.listenerUrl}
                    name={item.channel.name}
                    rowTint={item.rowTint}
                    slug={item.channel.slug}
                    speakerPageEnabled={item.channel.speakerPageEnabled}
                    speakerQrDataUrl={item.speakerQrDataUrl}
                    speakerUrl={item.speakerUrl}
                  />
                ))}
            </TruncatedList>
          ) : (
            <div className="mt-5 rounded-2xl border bg-white/70 px-4 py-5" style={{ borderColor: 'var(--us-border)' }}>
              <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                No channels yet.
              </p>
              {canManageChannelsUser ? (
                <Link href={`/events/${eventSlug}/channels/new`} className="us-button-primary mt-4 inline-flex px-4 py-2.5 text-sm font-medium">
                  Add first channel
                </Link>
              ) : (
                <p className="mt-3 text-sm" style={{ color: 'var(--us-muted)' }}>
                  Ask an organization manager to add channels for this event.
                </p>
              )}
            </div>
          )}
        </article>
      </section>
    </Layout>
  )
}
