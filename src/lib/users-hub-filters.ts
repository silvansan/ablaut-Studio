import { hasPlatformRole } from '@/lib/organization-user-utils'
import type { UserHubEntry } from '@/lib/users-hub-data'

export type UserHubStatusFilter = 'active' | 'inactive' | 'pending' | 'unassigned' | ''

export type { UserHubEntry }

export type UserHubFilterParams = {
  organization?: string
  q?: string
  status?: UserHubStatusFilter
}

export function filterUserHubEntries(entries: UserHubEntry[], filters: UserHubFilterParams): UserHubEntry[] {
  const query = filters.q?.trim().toLowerCase() ?? ''
  const organization = filters.organization?.trim() ?? ''
  const status = filters.status ?? ''

  return entries.filter((entry) => {
    if (query) {
      const haystack = [entry.userName, entry.userEmail, entry.organizationName ?? '']
        .join(' ')
        .toLowerCase()

      if (!haystack.includes(query)) {
        return false
      }
    }

    // Platform admins have no organization because they see all of them, not because they are unassigned.
    const unassigned = !entry.organizationId && !hasPlatformRole(entry.globalRole)

    if (organization === 'none') {
      if (!unassigned) {
        return false
      }
    } else if (organization) {
      if (entry.organizationSlug !== organization) {
        return false
      }
    }

    if (status === 'unassigned') {
      return unassigned
    }

    if (status === 'pending') {
      return entry.invitationStatus === 'pending'
    }

    if (status === 'inactive') {
      return entry.active === false
    }

    if (status === 'active') {
      return entry.active !== false && entry.invitationStatus !== 'pending'
    }

    return true
  })
}
