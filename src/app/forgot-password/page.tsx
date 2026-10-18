import type { Metadata } from 'next'
import Link from '@/components/OrgLink'

import { ForgotPasswordForm } from '@/components/ForgotPasswordForm'
import { Layout } from '@/components/Layout'
import { pageMetadata } from '@/lib/branding'

export const metadata: Metadata = pageMetadata('Get a new link')

export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  return (
    <Layout requireAuth={false} title="Get a New Link">
      <section className="mx-auto max-w-xl">
        <article className="us-panel px-6 py-7 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Account recovery
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
            Get a new link
          </h2>
          <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            Forgot your password, or did your invitation link expire? Enter your account email and ablaut will send a fresh link: a new invitation if you have not activated yet, or a password reset if you have.
          </p>
          <div className="mt-6">
            <ForgotPasswordForm />
          </div>
          <Link href="/" className="mt-5 inline-flex text-sm font-medium" style={{ color: 'var(--us-blue-dark)' }}>
            Back to login
          </Link>
        </article>
      </section>
    </Layout>
  )
}
