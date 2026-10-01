import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { resolvePublicLanguageFields } from '@/lib/channel-identity'
import { effectiveChannelSegment, effectiveEventSegment } from '@/lib/private-links'
import { getPublicEventBySlug } from '@/lib/public-channel'

type RouteContext = {
  params: Promise<{ eventSlug: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { eventSlug } = await params
  const payload = await getPayload({ config: configPromise })
  const event = await getPublicEventBySlug(eventSlug)

  if (!event || event.status !== 'active') {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const channels = await payload.find({
    collection: 'channels',
    depth: 0,
    limit: 100,
    overrideAccess: true,
    pagination: false,
    sort: 'sortOrder',
    where: {
      and: [
        {
          event: {
            equals: event.id,
          },
        },
        {
          enabled: {
            equals: true,
          },
        },
      ],
    },
  })

  return NextResponse.json({
    channels: channels.docs.map((channel) => {
      const publicLanguage = resolvePublicLanguageFields(channel)

      return {
        description: channel.description,
        hlsEnabled: channel.hlsEnabled,
        icecastFallbackUrl: channel.icecastFallbackUrl,
        languageCode: publicLanguage.languageCode,
        languageLabel: publicLanguage.languageLabel,
        listenerPageEnabled: channel.listenerPageEnabled,
        listenerTokenMode: channel.listenerTokenMode,
        name: channel.name,
        slug: effectiveChannelSegment(event, channel),
        speakerPageEnabled: channel.speakerPageEnabled,
        webrtcEnabled: channel.webrtcEnabled,
      }
    }),
    event: {
      defaultLanguage: event.defaultLanguage,
      publicListenerEnabled: event.publicListenerEnabled,
      slug: effectiveEventSegment(event),
      title: event.title,
    },
  })
}
