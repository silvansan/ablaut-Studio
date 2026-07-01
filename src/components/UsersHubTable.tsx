'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { bulkAssignUsersToOrganizationAction } from '@/app/users/actions'
import { TruncatedList } from '@/components/TruncatedList'
import { formatGlobalRole, formatOrganizationRole } from '@/lib/organization-user-utils'
import { INVITABLE_ORGANIZATION_ROLES } from '@/lib/organizations'
import { rowTintClass, type ListRowTint } from '@/lib/list-group-tints'
import type { UserHubEntry } from '@/lib/users-hub-data'
import type { Organization } from '@/payload-types'

type UsersHubTableProps = {
  entries: Array<UserHubEntry & { rowTint?: ListRowTint }>
  organizations: Organization[]
  showOrganizationColumn: boolean
}

export function UsersHubTable({ entries, organizations, showOrganizationColumn }: UsersHubTableProps) {
  const router = useRouter()
  const [selectedUserIDs, setSelectedUserIDs] = useState<Set<number>>(new Set())
  const selectableUserIDs = useMemo(
    () => entries.filter((entry) => !entry.organizationId).map((entry) => entry.userId),
    [entries],
  )
  const allSelectableSelected =
    selectableUserIDs.length > 0 && selectableUserIDs.every((userID) => selectedUserIDs.has(userID))
  const gridClass = showOrganizationColumn ? 'us-data-row--cols-5' : 'us-data-row--cols-4'

  function toggleUser(userID: number) {
    setSelectedUserIDs((current) => {
      const next = new Set(current)

      if (next.has(userID)) {
        next.delete(userID)
      } else {
        next.add(userID)
      }

      return next
    })
  }

  function toggleAllSelectable() {
    setSelectedUserIDs((current) => {
      if (allSelectableSelected) {
        const next = new Set(current)

        for (const userID of selectableUserIDs) {
          next.delete(userID)
        }

        return next
      }

      return new Set([...current, ...selectableUserIDs])
    })
  }

  function openUser(userID: number) {
    router.push(`/users/${userID}`)
  }

  return (
    <div className="space-y-4">
      {organizations.length > 0 && selectableUserIDs.length > 0 ? (
        <div className="us-panel px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Bulk assign
          </p>
          <p className="mt-2 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            Select unassigned users, then add them to one of your organizations.
          </p>
          <form action={bulkAssignUsersToOrganizationAction} className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_auto] lg:items-end">
            {[...selectedUserIDs].map((userID) => (
              <input key={userID} name="userIDs" type="hidden" value={userID} />
            ))}
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Organization
              <select
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={organizations.length === 1 ? organizations[0]?.id : ''}
                name="organizationId"
                required
                style={{ borderColor: 'var(--us-border)' }}
              >
                {organizations.length > 1 ? <option value="">Choose organization</option> : null}
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Org role
              <select
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue="moderator"
                name="roleInOrganization"
                style={{ borderColor: 'var(--us-border)' }}
              >
                {INVITABLE_ORGANIZATION_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="us-button-primary px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
              disabled={selectedUserIDs.size === 0}
              type="submit"
            >
              Add {selectedUserIDs.size > 0 ? selectedUserIDs.size : ''} user{selectedUserIDs.size === 1 ? '' : 's'}
            </button>
          </form>
        </div>
      ) : null}

      <div className="us-panel overflow-hidden px-4 py-4">
        <div className={`us-data-row us-data-row-header ${gridClass} px-4`} style={{ color: 'var(--us-muted)' }}>
          <span className="us-data-row__lead flex items-center gap-3">
            {selectableUserIDs.length > 0 ? (
              <input
                aria-label="Select all unassigned users"
                checked={allSelectableSelected}
                onChange={toggleAllSelectable}
                type="checkbox"
              />
            ) : null}
            <span>User</span>
          </span>
          {showOrganizationColumn ? <span className="us-data-row__chips">Organization</span> : null}
          <span className={showOrganizationColumn ? 'us-data-row__detail' : 'us-data-row__chips'}>Role</span>
          <span className="us-data-row__actions">Action</span>
        </div>
        <TruncatedList as="ul" itemLabel="users" listClassName="space-y-2">
          {entries.map((entry) => {
            const href = `/users/${entry.userId}`
            const isSelectable = !entry.organizationId
            const isSelected = selectedUserIDs.has(entry.userId)

            return (
              <li
                key={`${entry.userId}-${entry.organizationId ?? 'none'}`}
                className={`us-data-row ${gridClass} cursor-pointer rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-md ${rowTintClass(entry.rowTint ?? 'white')}`}
                onClick={() => openUser(entry.userId)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openUser(entry.userId)
                  }
                }}
                role="link"
                style={{ borderColor: 'var(--us-border)' }}
                tabIndex={0}
              >
                <div className="us-data-row__lead flex items-start gap-3">
                  {isSelectable ? (
                    <input
                      aria-label={`Select ${entry.userName}`}
                      checked={isSelected}
                      onClick={(event) => event.stopPropagation()}
                      onChange={() => toggleUser(entry.userId)}
                      type="checkbox"
                    />
                  ) : (
                    <span className="inline-block w-4" />
                  )}
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                      {entry.userName}
                    </span>
                    <p className="mt-1 text-sm" style={{ color: 'var(--us-muted)' }}>
                      {entry.userEmail}
                    </p>
                  </div>
                </div>

                {showOrganizationColumn ? (
                  <div className="us-data-row__chips">
                    {entry.organizationName ? (
                      <span className="us-chip us-chip-blue">{entry.organizationName}</span>
                    ) : (
                      <span className="us-chip us-chip-muted">No organization</span>
                    )}
                  </div>
                ) : null}

                <div className={`us-data-row__${showOrganizationColumn ? 'detail' : 'chips'}`}>
                  {showOrganizationColumn ? (
                    <span className="us-chip us-chip-muted capitalize">{formatOrganizationRole(entry.roleInOrganization)}</span>
                  ) : (
                    <>
                      <span className="us-chip us-chip-muted capitalize">{formatOrganizationRole(entry.roleInOrganization)}</span>
                      <span className="us-chip us-chip-blue capitalize">{formatGlobalRole(entry.globalRole)}</span>
                    </>
                  )}
                </div>

                <div className="us-data-row__actions">
                  <Link
                    className="text-sm font-medium hover:underline"
                    href={href}
                    onClick={(event) => event.stopPropagation()}
                    style={{ color: 'var(--us-blue-dark)' }}
                  >
                    {entry.organizationSlug ? 'View user' : 'Assign user'}
                  </Link>
                </div>
              </li>
            )
          })}
        </TruncatedList>
      </div>
    </div>
  )
}
