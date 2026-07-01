import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { OrganizationEventsPanel } from '@/components/OrganizationEventsPanel'
import { OrganizationSettingsPanel } from '@/components/OrganizationSettingsPanel'
import { OrganizationUsersPanel } from '@/components/OrganizationUsersPanel'
import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { getOrganizationBySlug, getOrganizationSummary } from '@/lib/organization-data'
import { getOrganizationUsersData } from '@/lib/organization-users-data'
import { hasOrganizationManagementAccess } from '@/lib/organizations'
import { isSuperAdminUser } from '@/lib/permissions'

type PageProps = {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ status?: string; tab?: string }>
}

export const dynamic = 'force-dynamic'

const VALID_TABS = new Set(['users', 'events', 'settings'])

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orgSlug } = await params
  const summary = await getOrganizationSummary(orgSlug)

  return {
    title: summary?.name ?? orgSlug,
  }
}

export default async function OrganizationDetailPage({ params, searchParams }: PageProps) {
  const { orgSlug } = await params
  const { status, tab: tabParam } = await searchParams
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  if (!(await hasOrganizationManagementAccess({ payload, user: currentUser } as never))) {
    notFound()
  }

  const [organization, summary] = await Promise.all([
    getOrganizationBySlug(orgSlug),
    getOrganizationSummary(orgSlug),
  ])

  if (!organization || !summary) {
    notFound()
  }

  const tab = tabParam && VALID_TABS.has(tabParam) ? tabParam : 'events'
  const canManageOrgUsers = await hasOrganizationManagementAccess({ payload, user: currentUser } as never)
  const usersData = tab === 'users' ? await getOrganizationUsersData(organization.id) : null
  const tabBase = `/organizations/${organization.slug}`

  return (
    <Layout hideHeader title={organization.name}>
      <section className="space-y-4">
        <div className="us-panel px-6 py-5">
          <div className="flex flex-wrap gap-2">
            <span className="us-chip us-chip-muted">{organization.slug}</span>
            <span className="us-chip us-chip-blue">
              {summary.eventCount} {summary.eventCount === 1 ? 'event' : 'events'}
            </span>
            <span className="us-chip us-chip-muted">
              {summary.memberCount} {summary.memberCount === 1 ? 'member' : 'members'}
            </span>
            {organization.active === false ? <span className="us-chip us-chip-warning">Inactive</span> : null}
          </div>
          {organization.description ? (
            <p className="mt-4 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              {organization.description}
            </p>
          ) : null}
        </div>

        <div className="us-panel flex flex-wrap items-center gap-2 px-6 py-5">
          {[
            ['Events', `${tabBase}?tab=events`],
            ['Users', `${tabBase}?tab=users`],
            ['Settings', `${tabBase}?tab=settings`],
          ].map(([label, href]) => {
            const active =
              (label === 'Events' && tab === 'events') ||
              (label === 'Users' && tab === 'users') ||
              (label === 'Settings' && tab === 'settings')

            return (
              <Link
                key={label}
                className="rounded-2xl border px-4 py-2 text-sm font-medium"
                href={href}
                style={{
                  backgroundColor: active ? 'var(--us-green-dark)' : 'white',
                  borderColor: active ? 'var(--us-green-dark)' : 'var(--us-border)',
                  color: active ? 'white' : 'var(--us-text)',
                }}
              >
                {label}
              </Link>
            )
          })}
          <Link className="us-button-secondary ml-auto px-4 py-2.5 text-sm font-medium" href="/organizations">
            All organizations
          </Link>
        </div>

        {tab === 'users' && usersData ? (
          <OrganizationUsersPanel
            canManageOrgUsers={canManageOrgUsers}
            currentUser={currentUser}
            data={usersData}
            organization={organization}
          />
        ) : null}
        {tab === 'events' ? <OrganizationEventsPanel organization={organization} status={status} /> : null}
        {tab === 'settings' ? (
          <OrganizationSettingsPanel
            canDelete={isSuperAdminUser(currentUser) && summary.eventCount === 0}
            organization={organization}
          />
        ) : null}
      </section>
    </Layout>
  )
}
