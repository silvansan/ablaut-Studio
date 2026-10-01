'use client'

import {
  createOrganizationAction,
  requestOrganizationMembershipAction,
} from '@/app/organizations/actions'
import { CollapsiblePanel } from '@/components/CollapsiblePanel'

type OrganizationsManagementProps = {
  isSuperAdmin: boolean
}

export function OrganizationsManagement({ isSuperAdmin }: OrganizationsManagementProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CollapsiblePanel description="Request access by organization slug." title="Join organization">
        <form action={requestOrganizationMembershipAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="block flex-1 text-sm font-medium" style={{ color: 'var(--us-text)' }}>
            Organization slug
            <input
              className="mt-2 w-full rounded-2xl border bg-white px-4 py-2.5 text-base outline-none"
              name="organizationSlug"
              placeholder="default"
              required
              style={{ borderColor: 'var(--us-border)' }}
            />
          </label>
          <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" type="submit">
            Submit request
          </button>
        </form>
      </CollapsiblePanel>

      {isSuperAdmin ? (
        <CollapsiblePanel description="Add a new organization for events and members." title="Create organization">
          <form action={createOrganizationAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Name
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-2.5 text-base outline-none"
                name="name"
                required
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Slug
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-2.5 text-base outline-none"
                name="slug"
                placeholder="optional"
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>
            <button className="us-button-primary px-4 py-2.5 text-sm font-medium" type="submit">
              Create
            </button>
          </form>
        </CollapsiblePanel>
      ) : null}
    </div>
  )
}
