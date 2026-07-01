import Link from 'next/link'
import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { OrganizationsManagement } from '@/components/OrganizationsManagement'
import { OrganizationRow } from '@/components/OrganizationRow'
import { Layout } from '@/components/Layout'
import { TruncatedList } from '@/components/TruncatedList'
import { pageMetadata } from '@/lib/branding'
import { requireAppUser } from '@/lib/app-auth'
import { getOrganizationSummaries } from '@/lib/organization-data'
import { countPendingJoinRequestsForUser, hasOrganizationManagementAccess } from '@/lib/organizations'
import { assignZebraTints } from '@/lib/list-group-tints'
import { isSuperAdminUser } from '@/lib/permissions'

export const metadata = pageMetadata('Organizations')

export const dynamic = 'force-dynamic'

export default async function OrganizationsPage() {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  if (!(await hasOrganizationManagementAccess({ payload, user: currentUser } as never))) {
    notFound()
  }

  const organizationSummaries = await getOrganizationSummaries()
  const pendingJoinRequestCount = await countPendingJoinRequestsForUser(payload, currentUser)
  const tintedOrganizations = assignZebraTints(
    [...organizationSummaries].sort((a, b) => a.name.localeCompare(b.name)),
  )
  const isSuperAdmin = isSuperAdminUser(currentUser)

  return (
    <Layout hideHeader title="Organizations">
      <section className="space-y-4">
        {pendingJoinRequestCount > 0 ? (
          <div className="us-panel px-6 py-5">
            <p className="text-sm font-medium" style={{ color: 'var(--us-green-dark)' }}>
              {pendingJoinRequestCount} pending join request{pendingJoinRequestCount === 1 ? '' : 's'}
            </p>
            <p className="mt-2 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              Open an organization&apos;s Users tab to approve or reject requests.
            </p>
          </div>
        ) : null}
        <div className="us-panel flex flex-wrap items-center gap-2 px-6 py-5">
          <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
            {organizationSummaries.length} organization{organizationSummaries.length === 1 ? '' : 's'}
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <OrganizationsManagement isSuperAdmin={isSuperAdmin} />
          </div>
        </div>

        {tintedOrganizations.length > 0 ? (
          <div className="us-panel overflow-hidden px-4 py-4">
            <div className="us-data-row us-data-row-header us-data-row--cols-4 px-4" style={{ color: 'var(--us-muted)' }}>
              <span className="us-data-row__lead">Organization</span>
              <span className="us-data-row__chips">Summary</span>
              <span className="us-data-row__detail">Action</span>
              <span className="us-data-row__actions">{isSuperAdmin ? 'Delete' : ''}</span>
            </div>
            <TruncatedList as="ul" itemLabel="organizations" listClassName="space-y-2">
              {tintedOrganizations.map((organization) => (
                <OrganizationRow
                  canDelete={isSuperAdmin && organization.eventCount === 0}
                  eventCount={organization.eventCount}
                  key={organization.id}
                  memberCount={organization.memberCount}
                  name={organization.name}
                  organizationId={organization.id}
                  rowTint={organization.rowTint}
                  slug={organization.slug}
                />
              ))}
            </TruncatedList>
          </div>
        ) : (
          <div className="us-panel px-6 py-6">
            <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              No organizations yet.{isSuperAdmin ? ' Create one using the button above.' : ' Ask a super admin to add you to an organization.'}
            </p>
            {!isSuperAdmin ? (
              <Link className="mt-3 inline-block text-sm font-medium hover:underline" href="/users" style={{ color: 'var(--us-blue-dark)' }}>
                Open users hub
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </Layout>
  )
}
