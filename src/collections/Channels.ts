import { APIError, type CollectionConfig, type PayloadRequest } from 'payload'

import { canCreateChannel } from '@/access/canCreateChannel'
import { canManageChannel } from '@/access/canManageChannel'
import { canReadChannel } from '@/access/canReadChannel'
import { slugifyChannelName } from '@/lib/channel-identity'
import { getLiveKitRoomName } from '@/lib/livekit'
import { syncChannelHlsPlaybackUrl } from '@/lib/streaming/resolve-channel-stream'
import { hashSpeakerPassword } from '@/lib/speaker-password'

function normalizeRelationshipID(value: number | string | { id?: number | string } | null | undefined) {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && 'id' in value) {
    return value.id ?? null
  }

  return null
}

async function syncEventChannels(req: PayloadRequest, eventID: number | string | null | undefined) {
  const comparableEventID = normalizeRelationshipID(eventID)

  if (!comparableEventID) {
    return
  }

  const channels = await req.payload.find({
    collection: 'channels',
    depth: 0,
    limit: 1000,
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      event: {
        equals: comparableEventID,
      },
    },
  })

  await req.payload.update({
    collection: 'events',
    id: comparableEventID,
    data: {
      channels: channels.docs.map((channel) => channel.id),
    },
    overrideAccess: true,
    req,
  })
}

export const Channels: CollectionConfig = {
  slug: 'channels',
  access: {
    create: canCreateChannel,
    delete: canManageChannel,
    read: canReadChannel,
    update: canManageChannel,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'event', 'enabled', 'sortOrder', 'createdBy'],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Overview',
          fields: [
            {
              name: 'event',
              type: 'relationship',
              relationTo: 'events',
              required: true,
            },
            {
              name: 'name',
              type: 'text',
              required: true,
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              index: true,
            },
            {
              name: 'publicId',
              type: 'text',
              unique: true,
              admin: {
                hidden: true,
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'languageCode',
                  type: 'text',
                  admin: {
                    description: 'Legacy field. Studio uses channel name as the display label.',
                  },
                },
                {
                  name: 'languageLabel',
                  type: 'text',
                  admin: {
                    description: 'Legacy field. Studio uses channel name as the display label.',
                  },
                },
              ],
            },
            {
              name: 'description',
              type: 'textarea',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  name: 'sortOrder',
                  type: 'number',
                  defaultValue: 0,
                },
              ],
            },
          ],
        },
        {
          label: 'Streaming',
          fields: [
            {
              name: 'roomName',
              type: 'text',
              admin: {
                description: 'Compatibility room name if older clients depend on it.',
              },
            },
            {
              name: 'livekitRoomName',
              type: 'text',
              admin: {
                description: 'Server-side LiveKit room name.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'webrtcEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  name: 'hlsEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Enable LL-HLS compatibility fallback for this channel.',
                  },
                },
              ],
            },
            {
              name: 'icecastFallbackUrl',
              type: 'text',
            },
            {
              name: 'hlsPlaybackUrl',
              type: 'text',
              admin: {
                description: 'Auto-generated HLS manifest URL when egress is active.',
                readOnly: true,
              },
            },
            {
              name: 'hlsEgressStatus',
              type: 'select',
              defaultValue: 'idle',
              options: [
                { label: 'Idle', value: 'idle' },
                { label: 'Starting', value: 'starting' },
                { label: 'Live', value: 'live' },
                { label: 'Error', value: 'error' },
              ],
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'hlsEgressId',
              type: 'text',
              admin: {
                readOnly: true,
              },
            },
            {
              name: 'audioQuality',
              type: 'group',
              fields: [
                {
                  name: 'echoCancellation',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'noiseSuppression',
                  type: 'checkbox',
                  defaultValue: false,
                },
                {
                  name: 'autoGainControl',
                  type: 'checkbox',
                  defaultValue: false,
                },
              ],
            },
          ],
        },
        {
          label: 'Access',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'listenerPageEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                },
                {
                  name: 'speakerPageEnabled',
                  type: 'checkbox',
                  defaultValue: true,
                },
              ],
            },
            {
              name: 'listenerTokenMode',
              type: 'select',
              defaultValue: 'public',
              options: [
                { label: 'Public', value: 'public' },
                { label: 'Password', value: 'password' },
                { label: 'Private', value: 'private' },
              ],
            },
            {
              name: 'speakerPasswordEnabled',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'speakerPassword',
              type: 'text',
              virtual: true,
              admin: {
                description: 'Enter a new channel-level speaker password. Only a secure hash is stored.',
              },
            },
            {
              name: 'speakerPasswordHash',
              type: 'text',
              admin: {
                hidden: true,
              },
            },
          ],
        },
      ],
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        await syncEventChannels(req, doc.event)

        const previousEventID = normalizeRelationshipID(previousDoc?.event)
        const nextEventID = normalizeRelationshipID(doc.event)

        if (previousEventID && previousEventID !== nextEventID) {
          await syncEventChannels(req, previousEventID)
        }
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await syncEventChannels(req, doc.event)
      },
    ],
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        const nextData = { ...data }

        if (typeof nextData.name === 'string' && !nextData.slug) {
          nextData.slug = slugifyChannelName(nextData.name)
        }

        if (typeof nextData.slug === 'string') {
          nextData.slug = slugifyChannelName(nextData.slug)
        }

        if (operation === 'create' && req.user?.id && !nextData.createdBy) {
          nextData.createdBy = req.user.id
        }

        if (typeof nextData.speakerPassword === 'string' && nextData.speakerPassword.trim().length > 0) {
          nextData.speakerPasswordHash = await hashSpeakerPassword(nextData.speakerPassword)
        }

        delete nextData.speakerPassword

        const eventID = normalizeRelationshipID(nextData.event) ?? normalizeRelationshipID(originalDoc?.event)

        if (eventID && typeof nextData.slug === 'string') {
          const duplicates = await req.payload.find({
            collection: 'channels',
            depth: 0,
            limit: 1,
            overrideAccess: true,
            pagination: false,
            req,
            where: {
              and: [
                { event: { equals: eventID } },
                { slug: { equals: nextData.slug } },
                ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
              ],
            },
          })

          if (duplicates.docs.length > 0) {
            throw new APIError(
              `Another channel in this event already uses the URL name "${nextData.slug}". Choose a different one.`,
              400,
            )
          }
        }

        if (eventID && (!nextData.roomName || !nextData.livekitRoomName)) {
          const event = await req.payload.findByID({
            collection: 'events',
            id: eventID,
            overrideAccess: true,
            req,
          })

          const eventSlug =
            typeof event.slug === 'string' && event.slug.length > 0 ? event.slug : String(eventID)
          const channelSlug =
            typeof nextData.slug === 'string' && nextData.slug.length > 0
              ? nextData.slug
              : typeof nextData.name === 'string'
                ? slugifyChannelName(nextData.name)
                : 'channel'
          const defaultRoomName = getLiveKitRoomName(eventSlug, channelSlug)

          if (!nextData.roomName) {
            nextData.roomName = defaultRoomName
          }

          if (!nextData.livekitRoomName) {
            nextData.livekitRoomName = defaultRoomName
          }

          const settings = await req.payload.findGlobal({
            slug: 'site-settings',
            overrideAccess: true,
            req,
          })

          if (nextData.hlsEnabled === true) {
            nextData.hlsPlaybackUrl = syncChannelHlsPlaybackUrl(
              {
                hlsEnabled: true,
                hlsPlaybackUrl: typeof nextData.hlsPlaybackUrl === 'string' ? nextData.hlsPlaybackUrl : null,
                slug: channelSlug,
              },
              { slug: eventSlug },
              settings,
            )
          } else if (nextData.hlsEnabled === false) {
            nextData.hlsPlaybackUrl = null
            nextData.hlsEgressStatus = 'idle'
            nextData.hlsEgressId = null
          }
        }

        return nextData
      },
    ],
  },
}
