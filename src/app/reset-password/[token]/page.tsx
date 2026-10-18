import configPromise from '@payload-config'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload } from 'payload'

import { ForgotPasswordForm } from '@/components/ForgotPasswordForm'
import { Layout } from '@/components/Layout'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'
import { getAccessTokenStatus } from '@/lib/access-tokens'
import { pageMetadata } from '@/lib/branding'

type PageProps = {
  params: Promise<{ token: string }>
}

export const metadata: Metadata = {
  ...pageMetadata('Set your password'),
  // One-time secrets live in this URL: keep it out of search indexes and referrers.
  referrer: 'no-referrer',
  robots: { follow: false, index: false },
}

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage({ params }: PageProps) {
  const { token } = await params
  const payload = await getPayload({ config: configPromise })
  const status = await getAccessTokenStatus(payload, token)

  return (
    <Layout requireAuth={false} title="Set Your Password">
      <section className="mx-auto max-w-xl">
        <article className="us-panel px-6 py-7 md:px-8">
          {status.state === 'valid' ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                {status.kind === 'invite' ? 'Invitation' : 'Account recovery'}
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                {status.kind === 'invite'
                  ? `Welcome${status.name ? `, ${status.name}` : ''}`
                  : 'Choose a new password'}
              </h2>
              <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                {status.kind === 'invite'
                  ? 'Pick a password to activate your account. You will be signed in right after.'
                  : 'Pick a new password. You will be signed in right after.'}
              </p>
              <div className="mt-6">
                <ResetPasswordForm email={status.email} kind={status.kind} token={token} />
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
                Link not valid
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                This link has expired or was already used
              </h2>
              <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                Each link works once. Enter your email and we will send a fresh one. If you were invited, you will
                get a new invitation; otherwise a password reset.
              </p>
              <div className="mt-6">
                <ForgotPasswordForm />
              </div>
            </>
          )}
          <Link className="mt-5 inline-flex text-sm font-medium" href="/" style={{ color: 'var(--us-blue-dark)' }}>
            Back to login
          </Link>
        </article>
      </section>
    </Layout>
  )
}
