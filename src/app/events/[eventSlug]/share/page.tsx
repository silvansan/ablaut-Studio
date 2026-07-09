import configPromise from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { AppBreadcrumbs } from '@/components/AppBreadcrumbs'
import { Layout } from '@/components/Layout'
import { PrintShareButton } from '@/components/PrintShareButton'
import { ShareZipButton } from '@/components/ShareZipButton'
import { requireAppUser } from '@/lib/app-auth'
import { pageMetadata } from '@/lib/branding'
import { getDashboardEvent } from '@/lib/dashboard-data'
import {
  buildUnifiedEventListenerQr,
  getEventSharePayload,
} from '@/lib/event-share'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { eventSlug } = await params
  const event = await getDashboardEvent(eventSlug)

  return pageMetadata(event ? `Share · ${event.title}` : 'Share & print')
}

export default async function EventSharePrintPage({ params }: PageProps) {
  const { eventSlug } = await params
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
    notFound()
  }

  const fullEvent = eventRecord.docs[0]
  const items = [...share.items]

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

  return (
    <Layout hideHeader title={`Share · ${share.event.title}`}>
      <section className="us-print-share space-y-5">
        <AppBreadcrumbs
          segments={[
            ...(share.event.organizationSlug
              ? [
                  {
                    href: `/organizations/${share.event.organizationSlug}`,
                    label: share.event.organizationTitle ?? 'Organization',
                  },
                ]
              : []),
            { href: `/events/${eventSlug}`, label: share.event.title },
            { label: 'Share & print' },
          ]}
        />

        <div className="us-print-share__toolbar flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Share &amp; print
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              {share.event.title}
            </h1>
            <p className="mt-2 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
              Print this page for signage, or download every QR as a ZIP of PNG files.
            </p>
          </div>
          <PrintShareButton />
          <ShareZipButton eventSlug={eventSlug} />
          <Link className="us-button-secondary px-4 py-2.5 text-sm font-medium" href={`/events/${eventSlug}`}>
            Back to event
          </Link>
        </div>

        {items.length === 0 ? (
          <p className="text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
            Add a channel to generate QR codes for this event.
          </p>
        ) : (
          <div className="us-print-share__grid grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article
                className="us-print-share__card rounded-3xl border bg-white px-4 py-4"
                key={item.fileName}
                style={{ borderColor: 'var(--us-border)' }}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--us-blue-dark)' }}>
                  {item.label}
                </p>
                <p className="mt-1 text-base font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                  {item.name}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={`${item.label} for ${item.name}`}
                  className="mx-auto mt-3 w-full max-w-[280px]"
                  src={item.qrDataUrl}
                />
                <p className="mt-3 break-all text-center text-xs leading-5" style={{ color: 'var(--us-muted)' }}>
                  {item.url}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </Layout>
  )
}
