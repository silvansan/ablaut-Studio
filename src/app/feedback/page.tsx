import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from '@/components/OrgLink'

import { FeedbackForm } from '@/components/FeedbackForm'
import { Layout } from '@/components/Layout'
import { SettingsPanel } from '@/components/SettingsPanel'
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
        <SettingsPanel
          hint={`Bugs, confusing steps or ideas. Messages go to ${FEEDBACK_RECIPIENT_EMAIL}.`}
          title="Send feedback"
        >
          <FeedbackForm defaultContactEmail={user?.email} defaultPageUrl={referer} />
          <Link className="inline-flex text-sm font-medium" href={user ? '/events' : '/'} style={{ color: 'var(--us-blue-dark)' }}>
            {user ? 'Back to events' : 'Back to sign in'}
          </Link>
        </SettingsPanel>
      </section>
    </Layout>
  )
}
