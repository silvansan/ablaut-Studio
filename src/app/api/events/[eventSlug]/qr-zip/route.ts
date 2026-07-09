import configPromise from '@payload-config'
import JSZip from 'jszip'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import {
  buildUnifiedEventListenerQr,
  dataUrlToPngBuffer,
  getEventSharePayload,
} from '@/lib/event-share'

type RouteContext = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: RouteContext) {
  const { eventSlug } = await context.params
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  const [share, eventRecord] = await Promise.all([
    getEventSharePayload(eventSlug),
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
  ])

  if (!share) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const items = [...share.items]
  const fullEvent = eventRecord.docs[0]

  if (fullEvent?.unifiedListenerQrEnabled === true) {
    items.unshift(
      await buildUnifiedEventListenerQr({
        eventSlug,
        eventTitle: share.event.title,
        organizationTitle: share.event.organizationTitle,
        publicBaseUrl: share.publicBaseUrl,
        qrStyle: share.qrStyle,
      }),
    )
  }

  if (items.length === 0) {
    return NextResponse.json({ error: 'No QR codes available for this event' }, { status: 404 })
  }

  const zip = new JSZip()

  for (const item of items) {
    const buffer = dataUrlToPngBuffer(item.qrDataUrl)

    if (!buffer) {
      continue
    }

    zip.file(item.fileName, buffer)
  }

  const zipBuffer = await zip.generateAsync({
    compression: 'DEFLATE',
    type: 'nodebuffer',
  })

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      'Content-Disposition': `attachment; filename="${eventSlug}-qrs.zip"`,
      'Content-Type': 'application/zip',
      'Cache-Control': 'no-store',
    },
  })
}
