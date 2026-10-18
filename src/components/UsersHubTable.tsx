'use client'

import Link from '@/components/OrgLink'
import { useMemo, useState } from 'react'

import { bulkUsersAction } from '@/app/users/actions'
import {
  BulkActionSelect,
  ListBulkActionsPanel,
  useBulkSelection,
  useVisibleBulkKeys,
} from '@/components/ListBulkActionsPanel'
import { BanIcon, BuildingIcon, MailIcon, ShieldIcon, StarIcon } from '@/components/ActionIcons'
import { Chip, ChipGrid, ListBody, ListPanel, ListRow, OpenIconButton, RowTitle } from '@/components/ListKit'
import { formatGlobalRole, formatOrganizationRole } from '@/lib/organization-user-utils'
import { INVITABLE_ORGANIZATION_ROLES } from '@/lib/organizations'
import type { UserHubEntry } from '@/lib/users-hub-data'
import type { Organization } from '@/payload-types'

type UsersHubTableProps = {
  entries: UserHubEntry[]
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

  return (
    <div className="space-y-4">
      <ListBulkActionsPanel
        description="Choose an action, then apply it to the selected users."
        selectedCount={selectedCount}
      >
        <form action={bulkUsersAction} className="flex w-max items-center gap-2">
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
            <label className="flex items-center">
              <span className="sr-only">Organization</span>
              <select
                className="us-input us-input--inline"
                defaultValue={filterOrganizationId ?? (organizations.length === 1 ? organizations[0]?.id : '')}
                name="organizationId"
                required
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
          ) : null}

          {needsRole ? (
            <label className="flex items-center">
              <span className="sr-only">Org role</span>
              <select
                className="us-input us-input--inline"
                defaultValue="moderator"
                name="roleInOrganization"
              >
                {INVITABLE_ORGANIZATION_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <button
            className={`px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
              isDestructive ? 'us-button-secondary' : 'us-button-primary'
            }`}
            disabled={selectedCount === 0}
            type="submit"
          >
            Apply to {selectedCount} selected
          </button>
        </form>
      </ListBulkActionsPanel>

      <ListPanel
        leading={
          <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--us-muted)' }}>
            <input
              aria-label="Select all visible users"
              checked={allVisibleSelected}
              onChange={() => toggleAll(visibleKeys)}
              type="checkbox"
            />
            Select all
          </label>
        }
      >
        <ListBody itemLabel="users">
          {entries.map((entry) => {
            const key = entryKey(entry)

            return (
              <ListRow
                actions={<OpenIconButton href={`/users/${entry.userId}`} label={`Open ${entry.userName}`} />}
                chips={
                  <ChipGrid columns={showOrganizationColumn ? '12rem 6.5rem 7.5rem' : '6.5rem 7.5rem'}>
                    {showOrganizationColumn ? (
                      entry.organizationName && entry.organizationSlug ? (
                        <Link
                          className="us-chip us-chip-blue"
                          href={`/users?organization=${encodeURIComponent(entry.organizationSlug)}`}
                          onClick={(event) => event.stopPropagation()}
                          title="Organization"
                        >
                          <BuildingIcon />
                          <span className="truncate">{entry.organizationName}</span>
                        </Link>
                      ) : (
                        <Link
                          className="us-chip us-chip-muted"
                          href="/users?organization=none"
                          onClick={(event) => event.stopPropagation()}
                          title="Not in any organization"
                        >
                          <BuildingIcon />
                          <span className="truncate">None</span>
                        </Link>
                      )
                    ) : null}
                    <Chip
                      className="capitalize"
                      icon={<ShieldIcon />}
                      title={entry.organizationName ? `Role in ${entry.organizationName}` : 'Role in the organization'}
                      tone="muted"
                    >
                      {formatOrganizationRole(entry.roleInOrganization)}
                    </Chip>
                    {/* Platform role only when it is special; "Moderator" is everyone's default. */}
                    {entry.globalRole === 'moderator' ? null : (
                      <Chip className="capitalize" icon={<StarIcon />} title="Platform role: works across all organizations" tone="blue">
                        {formatGlobalRole(entry.globalRole)}
                      </Chip>
                    )}
                  </ChipGrid>
                }
                href={`/users/${entry.userId}`}
                key={key}
                lead={
                  <RowTitle
                    badges={
                      <>
                        {entry.invitationStatus === 'pending' ? (
                          <Chip icon={<MailIcon />} title="Invitation not accepted yet" tone="warning">
                            Invited
                          </Chip>
                        ) : null}
                        {entry.active === false ? (
                          <Chip icon={<BanIcon />} title="Account is switched off" tone="warning">
                            Inactive
                          </Chip>
                        ) : null}
                      </>
                    }
                    subtitle={entry.userEmail}
                    title={entry.userName}
                  />
                }
                selection={{
                  checked: selectedKeys.has(key),
                  label: `Select ${entry.userName}`,
                  onChange: () => toggleKey(key),
                }}
              />
            )
          })}
        </ListBody>
      </ListPanel>
    </div>
  )
}
