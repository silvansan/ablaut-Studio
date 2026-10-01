import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { LoginForm } from '@/components/LoginForm'
import { Logo } from '@/components/Logo'
import { getCurrentAppUser } from '@/lib/app-auth'
import { pageMetadata } from '@/lib/branding'

export const metadata: Metadata = pageMetadata('Sign in')

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const user = await getCurrentAppUser()

  if (user) {
    redirect('/events')
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-6">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="us-panel us-hero-glow relative overflow-hidden px-6 py-8 md:px-8 md:py-10">
          <div className="relative z-10">
            <Logo />
            <span className="us-chip us-chip-blue mt-8">Self-hosted live audio</span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl" style={{ color: 'var(--us-green-dark)' }}>
              Welcome to live translation, made simple.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 md:text-lg" style={{ color: 'var(--us-muted)' }}>
              ablaut helps communities host clear event audio, speaker channels, listener links, and QR codes from their
              own server.
            </p>
          </div>
        </article>

        <article className="us-panel px-6 py-7 md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              ablaut login
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              Sign in to continue
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              Open your dashboard to prepare events, invite helpers, and manage live audio channels.
            </p>
          </div>

          <div className="mt-6">
            <LoginForm />
          </div>
        </article>
      </section>
    </main>
  )
}
