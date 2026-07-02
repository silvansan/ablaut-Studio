import { describe, expect, it } from 'vitest'

import { filterUserHubEntries } from '@/lib/users-hub-filters'
import type { UserHubEntry } from '@/lib/users-hub-data'

const sampleEntries: UserHubEntry[] = [
  {
    active: true,
    globalRole: 'moderator',
    invitationStatus: null,
    membershipId: 10,
    organizationId: 1,
    organizationName: 'Alpha Org',
    organizationSlug: 'alpha',
    roleInOrganization: 'manager',
    userEmail: 'alice@example.com',
    userId: 1,
    userName: 'Alice',
  },
  {
    active: true,
    globalRole: 'moderator',
    invitationStatus: 'pending',
    membershipId: 11,
    organizationId: 2,
    organizationName: 'Beta Org',
    organizationSlug: 'beta',
    roleInOrganization: 'moderator',
    userEmail: 'bob@example.com',
    userId: 2,
    userName: 'Bob',
  },
  {
    active: false,
    globalRole: 'moderator',
    invitationStatus: null,
    membershipId: null,
    organizationId: null,
    organizationName: null,
    organizationSlug: null,
    roleInOrganization: null,
    userEmail: 'carol@example.com',
    userId: 3,
    userName: 'Carol',
  },
]

describe('filterUserHubEntries', () => {
  it('filters by search query', () => {
    const result = filterUserHubEntries(sampleEntries, { q: 'bob' })

    expect(result).toHaveLength(1)
    expect(result[0]?.userName).toBe('Bob')
  })

  it('filters by organization slug', () => {
    const result = filterUserHubEntries(sampleEntries, { organization: 'alpha' })

    expect(result).toHaveLength(1)
    expect(result[0]?.userName).toBe('Alice')
  })

  it('filters unassigned users', () => {
    const result = filterUserHubEntries(sampleEntries, { organization: 'none' })

    expect(result).toHaveLength(1)
    expect(result[0]?.userName).toBe('Carol')
  })

  it('filters by pending status', () => {
    const result = filterUserHubEntries(sampleEntries, { status: 'pending' })

    expect(result).toHaveLength(1)
    expect(result[0]?.userName).toBe('Bob')
  })

  it('filters by inactive status', () => {
    const result = filterUserHubEntries(sampleEntries, { status: 'inactive' })

    expect(result).toHaveLength(1)
    expect(result[0]?.userName).toBe('Carol')
  })
})
