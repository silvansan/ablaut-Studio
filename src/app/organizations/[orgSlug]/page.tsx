import type { Metadata } from 'next'
import Link from '@/components/OrgLink'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { OrganizationEventsPanel } from '@/components/OrganizationEventsPanel'
import { OrganizationSettingsPanel } from '@/components/OrganizationSettingsPanel'
import { OrganizationUsersPanel } from '@/components/OrganizationUsersPanel'
import { FilterTabs } from '@/components/ListKit'
import { Layout } from '@/components/Layout'
import { WorkspaceHeader } from '@/components/WorkspaceHeader'
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
        <WorkspaceHeader
          actions={
            <Link className="us-button-secondary px-3 py-1.5 text-sm font-medium" href="/organizations">
              All organizations
            </Link>
          }
          chips={
            <>
              <span className="us-chip us-chip-blue">
                {summary.eventCount} {summary.eventCount === 1 ? 'event' : 'events'}
              </span>
              <span className="us-chip us-chip-muted">
                {summary.memberCount} {summary.memberCount === 1 ? 'member' : 'members'}
              </span>
              {organization.active === false ? <span className="us-chip us-chip-warning">Inactive</span> : null}
            </>
          }
          description={organization.description}
          title={organization.name}
        >
          <FilterTabs
            items={[
              { active: tab === 'events', href: `${tabBase}?tab=events`, label: 'Events' },
              { active: tab === 'users', href: `${tabBase}?tab=users`, label: 'People' },
              { active: tab === 'settings', href: `${tabBase}?tab=settings`, label: 'Settings' },
            ]}
            label="Organization sections"
          />
        </WorkspaceHeader>

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
