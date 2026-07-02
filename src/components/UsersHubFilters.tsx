import Link from 'next/link'

import type { UserHubStatusFilter } from '@/lib/users-hub-filters'
import type { Organization } from '@/payload-types'

type UsersHubFiltersProps = {
  filteredCount: number
  organization?: string
  organizations: Organization[]
  q?: string
  showOrganizationFilter: boolean
  status?: UserHubStatusFilter
  totalCount: number
}

export function UsersHubFilters({
  filteredCount,
  organization = '',
  organizations,
  q = '',
  showOrganizationFilter,
  status = '',
  totalCount,
}: UsersHubFiltersProps) {
  return (
    <article className="us-panel px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Find users
          </p>
          <p className="mt-2 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            {filteredCount === totalCount
              ? `${totalCount} user${totalCount === 1 ? '' : 's'}`
              : `${filteredCount} of ${totalCount} users`}
          </p>
        </div>
      </div>

      <form action="/users" className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Search
          <input
            className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
            defaultValue={q}
            name="q"
            placeholder="Name or email"
            style={{ borderColor: 'var(--us-border)' }}
            type="search"
          />
        </label>

        {showOrganizationFilter ? (
          <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
            Organization
            <select
              className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
              defaultValue={organization}
              name="organization"
              style={{ borderColor: 'var(--us-border)' }}
            >
              <option value="">All organizations</option>
              <option value="none">No organization</option>
              {organizations.map((item) => (
                <option key={item.id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
          Status
          <select
            className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
            defaultValue={status}
            name="status"
            style={{ borderColor: 'var(--us-border)' }}
          >
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="pending">Invite pending</option>
            <option value="inactive">Inactive</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
            Apply
          </button>
          {q || organization || status ? (
            <Link className="us-button-secondary px-5 py-3 text-sm font-medium" href="/users">
              Clear
            </Link>
          ) : null}
        </div>
      </form>
    </article>
  )
}
