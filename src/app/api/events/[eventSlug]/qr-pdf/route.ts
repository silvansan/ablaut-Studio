import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import {
  buildUnifiedEventListenerQr,
  dataUrlToPngBuffer,
  getEventSharePayload,
} from '@/lib/event-share'
import { buildImagePdf } from '@/lib/image-pdf'
import { loadPublicMobileAppRelease } from '@/lib/mobile-app-release'
import { effectiveEventSegment } from '@/lib/private-links'
import { generateBrandedDownloadQrDataUrl } from '@/lib/qrcode'

type RouteContext = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

type PdfKind = 'all' | 'listener' | 'speaker'

function parseKind(value: null | string): PdfKind {
  return value === 'listener' || value === 'speaker' ? value : 'all'
}

/**
 * One QR per A4 page. `?kind=listener`: the event-wide QR (if enabled), each channel's listener QR,
 * and the Android app QR last. `?kind=speaker`: each channel's speaker QR. No `kind`: everything.
 * Opens in the browser's PDF viewer, where the printer dialog decides how many pages go on a sheet.
 */
export async function GET(request: Request, context: RouteContext) {
  const { eventSlug } = await context.params
  const kind = parseKind(new URL(request.url).searchParams.get('kind'))
  const wantsListener = kind !== 'speaker'
  const wantsSpeaker = kind !== 'listener'
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
      where: { slug: { equals: eventSlug } },
    }),
  ])

  if (!share) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const eventSegment = effectiveEventSegment(share.event)
  const items = share.items.filter((item) => (item.kind === 'speaker' ? wantsSpeaker : wantsListener))

  if (wantsListener && eventRecord.docs[0]?.unifiedListenerQrEnabled === true) {
    items.unshift(
      await buildUnifiedEventListenerQr({
        eventSlug: eventSegment,
        eventTitle: share.event.title,
        organizationTitle: share.event.organizationTitle,
        publicBaseUrl: share.publicBaseUrl,
        qrStyle: share.qrStyle,
      }),
    )
  }

  const pages = items.map((item) => dataUrlToPngBuffer(item.qrDataUrl)).filter((png): png is Buffer => png !== null)
  const release = wantsListener ? await loadPublicMobileAppRelease(payload, share.publicBaseUrl) : null

  if (release?.latestVersion && release.downloadPageUrl) {
    const appQr = dataUrlToPngBuffer(
      await generateBrandedDownloadQrDataUrl({
        style: share.qrStyle,
        url: release.downloadPageUrl,
        version: release.latestVersion,
      }),
    )

    if (appQr) {
      pages.push(appQr)
    }
  }

  if (pages.length === 0) {
    return NextResponse.json({ error: 'No QR codes available for this event' }, { status: 404 })
  }

  const pdf = await buildImagePdf(pages)

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Disposition': `inline; filename="${eventSegment}-${kind === 'all' ? '' : `${kind}-`}qrs.pdf"`,
      'Content-Type': 'application/pdf',
    },
  })
}
