import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'

import { FeedbackForm } from '@/components/FeedbackForm'
import { Layout } from '@/components/Layout'
import { getCurrentAppUser } from '@/lib/app-auth'
import { pageMetadata } from '@/lib/branding'
import { FEEDBACK_RECIPIENT_EMAIL } from '@/lib/feedback'

export const metadata: Metadata = pageMetadata('Beta feedback')

export const dynamic = 'force-dynamic'

export default async function FeedbackPage() {
  const user = await getCurrentAppUser()
  const requestHeaders = await headers()
  const referer = requestHeaders.get('referer')

  return (
    <Layout hideBetaBanner hideHeader requireAuth={false} title="Beta feedback">
      <section className="mx-auto max-w-2xl">
        <article className="us-panel px-6 py-7 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Beta program
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
            Send feedback to the creator
          </h2>
          <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            ablaut-Studio is in active development. Report bugs, confusing flows, or ideas here. Messages go to{' '}
            <a className="font-medium hover:underline" href={`mailto:${FEEDBACK_RECIPIENT_EMAIL}`} style={{ color: 'var(--us-blue-dark)' }}>
              {FEEDBACK_RECIPIENT_EMAIL}
            </a>
            .
          </p>
          <div className="mt-6">
            <FeedbackForm defaultContactEmail={user?.email} defaultPageUrl={referer} />
          </div>
          <Link className="mt-5 inline-flex text-sm font-medium" href={user ? '/dashboard' : '/'} style={{ color: 'var(--us-blue-dark)' }}>
            {user ? 'Back to dashboard' : 'Back to login'}
          </Link>
        </article>
      </section>
    </Layout>
  )
}
