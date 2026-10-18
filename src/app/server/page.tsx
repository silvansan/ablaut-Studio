import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Layout } from '@/components/Layout'
import { ServerStatsPanel } from '@/components/ServerStatsPanel'
import { requireAppUser } from '@/lib/app-auth'
import { pageMetadata } from '@/lib/branding'
import { isSuperAdminUser } from '@/lib/permissions'

export const metadata: Metadata = pageMetadata('Server health')

export const dynamic = 'force-dynamic'

export default async function ServerHealthPage() {
  const user = await requireAppUser()

  if (!isSuperAdminUser(user)) {
    notFound()
  }

  return (
    <Layout hideHeader title="Server health">
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
            Server health
          </h2>
          <p className="mt-1 text-sm" style={{ color: 'var(--us-muted)' }}>
            Live numbers from this server. Useful on event day to see whether it is coping.
          </p>
        </div>
        <ServerStatsPanel />
      </section>
    </Layout>
  )
}
