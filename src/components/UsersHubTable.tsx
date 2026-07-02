'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

import { bulkUsersAction } from '@/app/users/actions'
import {
  BulkActionSelect,
  ListBulkActionsPanel,
  useBulkSelection,
  useVisibleBulkKeys,
} from '@/components/ListBulkActionsPanel'
import { TruncatedList } from '@/components/TruncatedList'
import { formatGlobalRole, formatOrganizationRole } from '@/lib/organization-user-utils'
import { INVITABLE_ORGANIZATION_ROLES } from '@/lib/organizations'
import { rowTintClass, type ListRowTint } from '@/lib/list-group-tints'
import type { UserHubEntry } from '@/lib/users-hub-data'
import type { Organization } from '@/payload-types'

type UsersHubTableProps = {
  entries: Array<UserHubEntry & { rowTint?: ListRowTint }>
  filterOrganizationId?: number | null
  isSuperAdmin: boolean
  organizations: Organization[]
  returnPath: string
  showOrganizationColumn: boolean
}

function entryKey(entry: UserHubEntry): string {
  return `${entry.userId}:${entry.membershipId ?? 'none'}`
}

export function UsersHubTable({
  entries,
  filterOrganizationId = null,
  isSuperAdmin,
  organizations,
  returnPath,
  showOrganizationColumn,
}: UsersHubTableProps) {
  const router = useRouter()
  const { selectedCount, selectedKeys, toggleAll, toggleKey } = useBulkSelection<string>()
  const [bulkAction, setBulkAction] = useState(
    filterOrganizationId ? 'set-org-role' : 'assign',
  )

  const selectableItems = useMemo(
    () => entries.map((entry) => ({ key: entryKey(entry), selectable: true })),
    [entries],
  )
  const visibleKeys = useVisibleBulkKeys(selectableItems)
  const allVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every((key) => selectedKeys.has(key))
  const gridClass = showOrganizationColumn ? 'us-data-row--cols-5' : 'us-data-row--cols-4'

  const selectedEntries = entries.filter((entry) => selectedKeys.has(entryKey(entry)))
  const selectedUserIDs = [...new Set(selectedEntries.map((entry) => entry.userId))]
  const selectedMembershipIDs = selectedEntries
    .map((entry) => entry.membershipId)
    .filter((value): value is number => typeof value === 'number')

  const bulkOptions = useMemo(() => {
    const options = [{ label: 'Add to organization', value: 'assign' }]

    if (filterOrganizationId) {
      options.push(
        { label: 'Change organization role', value: 'set-org-role' },
        { label: 'Remove from organization', value: 'remove-from-org' },
        { label: 'Resend invite', value: 'resend-invite' },
      )
    }

    options.push({ label: 'Send password reset', value: 'password-reset' })

    if (isSuperAdmin) {
      options.push(
        { label: 'Activate accounts', value: 'activate' },
        { label: 'Deactivate accounts', value: 'deactivate' },
        { label: 'Delete users', value: 'delete' },
      )
    }

    return options
  }, [filterOrganizationId, isSuperAdmin])

  const needsOrganization =
    bulkAction === 'assign' ||
    bulkAction === 'set-org-role' ||
    bulkAction === 'remove-from-org' ||
    bulkAction === 'resend-invite'
  const needsRole = bulkAction === 'assign' || bulkAction === 'set-org-role'
  const isDestructive = bulkAction === 'delete' || bulkAction === 'remove-from-org'

  function openUser(userID: number) {
    router.push(`/users/${userID}`)
  }

  return (
    <div className="space-y-4">
      <ListBulkActionsPanel
        description="Choose an action, then apply it to the selected users."
        selectedCount={selectedCount}
      >
        <form action={bulkUsersAction} className="grid gap-3 xl:grid-cols-[220px_220px_220px_auto] xl:items-end">
          <input name="returnPath" type="hidden" value={returnPath} />
          <input name="bulkAction" type="hidden" value={bulkAction} />
          {selectedUserIDs.map((userID) => (
            <input key={`user-${userID}`} name="userIDs" type="hidden" value={userID} />
          ))}
          {selectedMembershipIDs.map((membershipID) => (
            <input key={`membership-${membershipID}`} name="membershipIDs" type="hidden" value={membershipID} />
          ))}

          <BulkActionSelect action={bulkAction} onActionChange={setBulkAction} options={bulkOptions} />

          {needsOrganization ? (
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Organization
              <select
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={filterOrganizationId ?? (organizations.length === 1 ? organizations[0]?.id : '')}
                name="organizationId"
                required
                style={{ borderColor: 'var(--us-border)' }}
              >
                {organizations.length > 1 && !filterOrganizationId ? (
                  <option value="">Choose organization</option>
                ) : null}
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div />
          )}

          {needsRole ? (
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
          ) : (
            <div />
          )}

          <button
            className={`px-5 py-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
              isDestructive ? 'us-button-secondary' : 'us-button-primary'
            }`}
            disabled={selectedCount === 0}
            type="submit"
          >
            Apply to {selectedCount} selected
          </button>
        </form>
      </ListBulkActionsPanel>

      <div className="us-panel overflow-hidden px-4 py-4">
        <div className={`us-data-row us-data-row-header ${gridClass} px-4`} style={{ color: 'var(--us-muted)' }}>
          <span className="us-data-row__lead flex items-center gap-3">
            <input
              aria-label="Select all visible users"
              checked={allVisibleSelected}
              onChange={() => toggleAll(visibleKeys)}
              type="checkbox"
            />
            <span>User</span>
          </span>
          {showOrganizationColumn ? <span className="us-data-row__chips">Organization</span> : null}
          <span className={showOrganizationColumn ? 'us-data-row__detail' : 'us-data-row__chips'}>Role</span>
          <span className="us-data-row__actions">Action</span>
        </div>
        <TruncatedList as="ul" itemLabel="users" listClassName="space-y-2">
          {entries.map((entry) => {
            const href = `/users/${entry.userId}`
            const key = entryKey(entry)
            const isSelected = selectedKeys.has(key)

            return (
              <li
                key={key}
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
                  <input
                    aria-label={`Select ${entry.userName}`}
                    checked={isSelected}
                    onChange={() => toggleKey(key)}
                    onClick={(event) => event.stopPropagation()}
                    type="checkbox"
                  />
                  <div>
                    <span className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                      {entry.userName}
                    </span>
                    <p className="mt-1 text-sm" style={{ color: 'var(--us-muted)' }}>
                      {entry.userEmail}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.invitationStatus === 'pending' ? (
                        <span className="us-chip us-chip-warning">Invite pending</span>
                      ) : null}
                      {entry.active === false ? <span className="us-chip us-chip-warning">Inactive</span> : null}
                    </div>
                  </div>
                </div>

                {showOrganizationColumn ? (
                  <div className="us-data-row__chips">
                    {entry.organizationName && entry.organizationSlug ? (
                      <Link
                        className="us-chip us-chip-blue hover:-translate-y-0.5"
                        href={`/users?organization=${encodeURIComponent(entry.organizationSlug)}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {entry.organizationName}
                      </Link>
                    ) : (
                      <Link
                        className="us-chip us-chip-muted hover:-translate-y-0.5"
                        href="/users?organization=none"
                        onClick={(event) => event.stopPropagation()}
                      >
                        No organization
                      </Link>
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
                    View user
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
