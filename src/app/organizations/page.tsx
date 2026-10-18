import { notFound } from 'next/navigation'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { OrganizationsManagement } from '@/components/OrganizationsManagement'
import { OrganizationRow } from '@/components/OrganizationRow'
import { Layout } from '@/components/Layout'
import { ListBody, ListEmpty, ListPanel } from '@/components/ListKit'
import { PageHeader } from '@/components/PageHeader'
import { pageMetadata } from '@/lib/branding'
import { requireAppUser } from '@/lib/app-auth'
import { getOrganizationSummaries } from '@/lib/organization-data'
import { hasOrganizationManagementAccess } from '@/lib/organizations'
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
  const sortedOrganizations = [...organizationSummaries].sort((a, b) => a.name.localeCompare(b.name))
  const isSuperAdmin = isSuperAdminUser(currentUser)

  return (
    <Layout hideHeader title="Organizations">
      <section className="space-y-4">
        <PageHeader actions={<OrganizationsManagement isSuperAdmin={isSuperAdmin} />} title="Organizations" />

        <ListPanel>
          {sortedOrganizations.length > 0 ? (
            <ListBody itemLabel="organizations">
              {sortedOrganizations.map((organization) => (
                <OrganizationRow
                  canDelete={isSuperAdmin && organization.eventCount === 0}
                  eventCount={organization.eventCount}
                  key={organization.id}
                  memberCount={organization.memberCount}
                  name={organization.name}
                  organizationId={organization.id}
                  slug={organization.slug}
                />
              ))}
            </ListBody>
          ) : (
            <ListEmpty>
              No organizations yet.{isSuperAdmin ? ' Create one with the button above.' : ' Ask a super admin to add you to one.'}
            </ListEmpty>
          )}
        </ListPanel>
      </section>
    </Layout>
  )
}
