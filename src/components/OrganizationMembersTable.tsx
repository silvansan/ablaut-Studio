'use client'

import Link from 'next/link'
import { useState } from 'react'

import {
  removeMembershipAction,
} from '@/app/users/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { SideDrawer } from '@/components/SideDrawer'
import { UserAccountActions } from '@/components/UserAccountActions'
import { UserAccountForm } from '@/components/UserAccountForm'
import { UserEventAssignmentsSection } from '@/components/UserEventAssignmentsSection'
import { UserOrganizationMembershipsSection } from '@/components/UserOrganizationMembershipsSection'
import { TruncatedList } from '@/components/TruncatedList'
import { rowTintClass, type ListRowTint } from '@/lib/list-group-tints'
import { getUserEventSummary } from '@/lib/organization-user-utils'
import type { OrganizationUsersData } from '@/lib/organization-users-data'
import { isSuperAdminUser } from '@/lib/permissions'
import type { Organization, User } from '@/payload-types'

type OrganizationMembersTableProps = {
  assignableEvents: OrganizationUsersData['assignableEvents']
  assignmentsByUserID: OrganizationUsersData['assignmentsByUserID']
  canManageOrgUsers: boolean
  currentUser: User
  manageableOrganizations: Organization[]
  membershipByUserID: OrganizationUsersData['membershipByUserID']
  organization: Organization
  organizationMembershipsByUserID: OrganizationUsersData['organizationMembershipsByUserID']
  userEvents: OrganizationUsersData['userEvents']
  users: Array<User & { rowTint?: ListRowTint }>
}

export function OrganizationMembersTable({
  assignableEvents,
  assignmentsByUserID,
  canManageOrgUsers,
  currentUser,
  manageableOrganizations,
  membershipByUserID,
  organization,
  organizationMembershipsByUserID,
  userEvents,
  users,
}: OrganizationMembersTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null
  const selectedMembership = selectedUser ? membershipByUserID.get(selectedUser.id) : undefined
  const canManageSelectedUser = canManageOrgUsers && selectedUser && String(selectedUser.id) !== String(currentUser.id)

  return (
    <>
      <article className="us-panel overflow-hidden px-4 py-4">
        <h3 className="px-3 text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
          Members
        </h3>
        <div className="us-data-row us-data-row-header us-data-row--cols-5 px-4 pt-4" style={{ color: 'var(--us-muted)' }}>
          <span className="us-data-row__lead">Username</span>
          <span className="us-data-row__detail">Email</span>
          <span className="us-data-row__detail">Events</span>
          <span className="us-data-row__detail">Active?</span>
          <span className="us-data-row__actions" />
        </div>

        {users.length === 0 ? (
          <p className="px-3 py-4 text-sm" style={{ color: 'var(--us-muted)' }}>
            No members yet. Invite someone to get started.
          </p>
        ) : (
          <TruncatedList itemLabel="members" listClassName="space-y-3">
            {users.map((user) => {
              const membership = membershipByUserID.get(user.id)

              return (
                <div
                  className={`us-data-row us-data-row--cols-5 rounded-3xl border px-4 py-4 ${rowTintClass(user.rowTint ?? 'white')}`}
                  key={user.id}
                  style={{ borderColor: 'var(--us-border)' }}
                >
                  <div className="us-data-row__lead">
                    <Link className="font-semibold hover:underline" href={`/users/${user.id}`} style={{ color: 'var(--us-green-dark)' }}>
                      {user.name}
                    </Link>
                    <span className="ml-2 us-chip us-chip-muted min-[960px]:hidden">
                      {membership?.roleInOrganization?.replace('_', ' ') ?? user.role?.replace('_', ' ') ?? 'user'}
                    </span>
                  </div>
                  <div className="us-data-row__detail break-all text-sm" style={{ color: 'var(--us-muted)' }}>
                    {user.email}
                  </div>
                  <div className="us-data-row__detail text-sm" style={{ color: 'var(--us-muted)' }}>
                    {getUserEventSummary(user.id, userEvents)}
                  </div>
                  <div className="us-data-row__detail flex items-center gap-2">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border text-sm ${user.active === false ? 'opacity-35' : ''}`}
                      style={{ borderColor: 'var(--us-green)', color: 'var(--us-green-dark)' }}
                    >
                      {user.active === false ? '' : '✓'}
                    </span>
                  </div>
                  <div className="us-data-row__actions flex flex-wrap justify-end gap-2">
                    <Link className="us-button-secondary px-3 py-2 text-sm font-medium" href={`/users/${user.id}`}>
                      Open
                    </Link>
                    {canManageOrgUsers ? (
                      <button
                        className="us-button-primary px-3 py-2 text-sm font-medium"
                        onClick={() => setSelectedUserId(user.id)}
                        type="button"
                      >
                        Edit
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </TruncatedList>
        )}
      </article>

      <SideDrawer
        description={selectedUser ? `${selectedUser.email} · ${organization.name}` : undefined}
        onClose={() => setSelectedUserId(null)}
        open={selectedUser !== null}
        title={selectedUser ? selectedUser.name : 'Member'}
      >
        {selectedUser && canManageSelectedUser ? (
          <div className="space-y-6">
            <UserAccountForm
              currentUser={currentUser}
              layout="drawer"
              organizationId={organization.id}
              targetUser={selectedUser}
            />

            <UserOrganizationMembershipsSection
              canManageMemberships={canManageOrgUsers}
              memberships={organizationMembershipsByUserID.get(selectedUser.id) ?? []}
              organizations={manageableOrganizations}
              targetUserID={selectedUser.id}
            />

            {selectedUser.role === 'moderator' || isSuperAdminUser(currentUser) ? (
              <UserEventAssignmentsSection
                assignments={assignmentsByUserID.get(selectedUser.id) ?? []}
                assignableEvents={assignableEvents}
                canManageAssignments={canManageOrgUsers}
                canSetAdminRole={isSuperAdminUser(currentUser)}
                targetUserID={selectedUser.id}
              />
            ) : null}

            <UserAccountActions
              formIdPrefix="org-drawer"
              organizationId={organization.id}
              targetUser={selectedUser}
            />

            {selectedMembership ? (
              <form action={removeMembershipAction} id={`drawer-remove-${selectedUser.id}`}>
                <input name="membershipId" type="hidden" value={selectedMembership.id} />
                <input name="organizationId" type="hidden" value={organization.id} />
                <ConfirmSubmitButton
                  action={removeMembershipAction}
                  confirmMessage={`Remove ${selectedUser.name} from ${organization.name}? Their global account will remain.`}
                  formId={`drawer-remove-${selectedUser.id}`}
                  title="Remove from organization"
                >
                  Remove from organization
                </ConfirmSubmitButton>
              </form>
            ) : null}
          </div>
        ) : selectedUser ? (
          <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            Open the full user page to review this account, or choose another member to manage.
          </p>
        ) : null}
      </SideDrawer>
    </>
  )
}
