import Link from 'next/link'
import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { InviteUserPanel } from '@/components/InviteUserPanel'
import { Layout } from '@/components/Layout'
import { UsersHubFilters } from '@/components/UsersHubFilters'
import { UsersHubTable } from '@/components/UsersHubTable'
import { pageMetadata } from '@/lib/branding'
import { requireAppUser } from '@/lib/app-auth'
import { assignZebraTints } from '@/lib/list-group-tints'
import { hasOrganizationManagementAccess } from '@/lib/organizations'
import { isSuperAdminUser } from '@/lib/permissions'
import { getUsersHubData } from '@/lib/users-hub-data'
import { filterUserHubEntries, type UserHubStatusFilter } from '@/lib/users-hub-filters'

export const metadata = pageMetadata('Users')

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{
    organization?: string
    q?: string
    status?: string
  }>
}

function parseStatusFilter(value?: string): UserHubStatusFilter {
  if (value === 'active' || value === 'inactive' || value === 'pending' || value === 'unassigned') {
    return value
  }

  return ''
}

export default async function UsersPage({ searchParams }: PageProps) {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  if (!(await hasOrganizationManagementAccess({ payload, user: currentUser } as never))) {
    notFound()
  }

  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const organization = params.organization?.trim() ?? ''
  const status = parseStatusFilter(params.status)

  const { entries, organizations, showOrganizationColumn } = await getUsersHubData()
  const filteredEntries = filterUserHubEntries(entries, { organization, q, status })
  const tintedEntries = assignZebraTints(filteredEntries)
  const selectedOrganization = organization
    ? organizations.find((item) => item.slug === organization)
    : undefined
  const returnParams = new URLSearchParams()

  if (q) {
    returnParams.set('q', q)
  }

  if (organization) {
    returnParams.set('organization', organization)
  }

  if (status) {
    returnParams.set('status', status)
  }

  const returnPath = returnParams.toString() ? `/users?${returnParams.toString()}` : '/users'

  return (
    <Layout hideHeader title="Users">
      <section className="space-y-4">
        <div className="us-panel flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            {selectedOrganization
              ? `Showing users in ${selectedOrganization.name}.`
              : organization === 'none'
                ? 'Showing users without an organization.'
                : showOrganizationColumn
                  ? 'Manage users across your organizations.'
                  : `Manage users in ${organizations[0]?.name ?? 'your organization'}.`}
          </p>
          <InviteUserPanel
            canCreateOrganization={isSuperAdminUser(currentUser)}
            canSetPlatformRole={isSuperAdminUser(currentUser)}
            defaultOrganizationId={
              selectedOrganization?.id ?? (organizations.length === 1 ? organizations[0]?.id : undefined)
            }
            hideOrganizationSelector={Boolean(selectedOrganization) || organizations.length === 1}
            organizations={organizations}
          />
        </div>

        {entries.length > 0 ? (
          <>
            <UsersHubFilters
              filteredCount={filteredEntries.length}
              organization={organization}
              organizations={organizations}
              q={q}
              showOrganizationFilter={showOrganizationColumn}
              status={status}
              totalCount={entries.length}
            />

            {tintedEntries.length > 0 ? (
              <UsersHubTable
                entries={tintedEntries}
                filterOrganizationId={selectedOrganization?.id ?? null}
                isSuperAdmin={isSuperAdminUser(currentUser)}
                organizations={organizations}
                returnPath={returnPath}
                showOrganizationColumn={showOrganizationColumn}
              />
            ) : (
              <div className="us-panel px-6 py-6">
                <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                  No users match these filters.
                </p>
                <Link
                  className="mt-3 inline-block text-sm font-medium hover:underline"
                  href="/users"
                  style={{ color: 'var(--us-blue-dark)' }}
                >
                  Clear filters
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="us-panel px-6 py-6">
            <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              No users are available yet.
            </p>
            {organizations.length > 0 ? (
              <Link
                className="mt-3 inline-block text-sm font-medium hover:underline"
                href="/organizations"
                style={{ color: 'var(--us-blue-dark)' }}
              >
                Open organizations
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </Layout>
  )
}
