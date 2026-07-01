import Link from 'next/link'
import configPromise from '@payload-config'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { InviteUserPanel } from '@/components/InviteUserPanel'
import { Layout } from '@/components/Layout'
import { UsersHubTable } from '@/components/UsersHubTable'
import { pageMetadata } from '@/lib/branding'
import { requireAppUser } from '@/lib/app-auth'
import { assignZebraTints } from '@/lib/list-group-tints'
import { hasOrganizationManagementAccess } from '@/lib/organizations'
import { isSuperAdminUser } from '@/lib/permissions'
import { getUsersHubData } from '@/lib/users-hub-data'

export const metadata = pageMetadata('Users')

export const dynamic = 'force-dynamic'

type PageProps = {
  searchParams: Promise<{ organization?: string }>
}

export default async function UsersPage({ searchParams }: PageProps) {
  const currentUser = await requireAppUser()
  const payload = await getPayload({ config: configPromise })

  if (!(await hasOrganizationManagementAccess({ payload, user: currentUser } as never))) {
    notFound()
  }

  const { organization: organizationSlug } = await searchParams

  if (organizationSlug) {
    redirect(`/organizations/${organizationSlug}?tab=users`)
  }

  const { entries, organizations, showOrganizationColumn } = await getUsersHubData()
  const tintedEntries = assignZebraTints(entries)

  return (
    <Layout hideHeader title="Users">
      <section className="space-y-4">
        <div className="us-panel flex flex-wrap items-center justify-between gap-3 px-6 py-5">
          <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            {entries.length} user{entries.length === 1 ? '' : 's'}
            {showOrganizationColumn ? ' across your organizations' : ` in ${organizations[0]?.name ?? 'your organization'}`}.
          </p>
          <InviteUserPanel
            canCreateOrganization={isSuperAdminUser(currentUser)}
            canSetPlatformRole={isSuperAdminUser(currentUser)}
            defaultOrganizationId={organizations.length === 1 ? organizations[0]?.id : undefined}
            hideOrganizationSelector={organizations.length === 1}
            organizations={organizations}
          />
        </div>

        {tintedEntries.length > 0 ? (
          <UsersHubTable
            entries={tintedEntries}
            organizations={organizations}
            showOrganizationColumn={showOrganizationColumn}
          />
        ) : (
          <div className="us-panel px-6 py-6">
            <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              No users are available yet.
            </p>
            {organizations.length > 0 ? (
              <Link className="mt-3 inline-block text-sm font-medium hover:underline" href="/organizations" style={{ color: 'var(--us-blue-dark)' }}>
                Open organizations
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </Layout>
  )
}
