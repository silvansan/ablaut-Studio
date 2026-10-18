import { SearchIcon } from '@/components/ActionIcons'

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

/** One slim line: a search field with an icon, optional filters, and the count. No heading needed. */
export function UsersHubFilters({
  filteredCount,
  organization = '',
  organizations,
  q = '',
  showOrganizationFilter,
  status = '',
  totalCount,
}: UsersHubFiltersProps) {
  const filtered = Boolean(q || organization || status)

  return (
    // action="" submits to the page you are on, so it works inside an organization and on Platform alike.
    <form action="" className="us-panel flex flex-wrap items-center gap-2 px-3 py-2" role="search">
      <label className="relative min-w-[12rem] flex-1">
        <span className="sr-only">Search users by name or email</span>
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--us-muted)]" />
        <input
          className="us-input us-input--search"
          defaultValue={q}
          name="q"
          placeholder="Name or email"
          type="search"
        />
      </label>

      {showOrganizationFilter ? (
        <label className="flex items-center">
          <span className="sr-only">Organization</span>
          <select className="us-input us-input--inline" defaultValue={organization} name="organization">
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

      <label className="flex items-center">
        <span className="sr-only">Status</span>
        <select className="us-input us-input--inline" defaultValue={status} name="status">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="pending">Invite pending</option>
          <option value="inactive">Inactive</option>
          <option value="unassigned">Unassigned</option>
        </select>
      </label>

      <button className="us-button-primary px-3 py-1.5 text-sm font-medium" type="submit">
        Apply
      </button>
      {filtered ? (
        // Plain anchor on purpose: "?" keeps the current page and drops the filters.
        <a className="us-button-secondary px-3 py-1.5 text-sm font-medium" href="?">
          Clear
        </a>
      ) : null}

      <p className="ml-auto whitespace-nowrap text-xs" style={{ color: 'var(--us-muted)' }}>
        {filteredCount === totalCount ? totalCount : `${filteredCount} of ${totalCount}`}{' '}
        {totalCount === 1 ? 'user' : 'users'}
      </p>
    </form>
  )
}
