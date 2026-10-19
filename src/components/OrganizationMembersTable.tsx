'use client'

import { useState } from 'react'

import {
  removeMembershipAction,
} from '@/app/users/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { Drawer } from '@/components/Drawer'
import { UserAccountActions } from '@/components/UserAccountActions'
import { UserAccountForm } from '@/components/UserAccountForm'
import { UserEventAssignmentsSection } from '@/components/UserEventAssignmentsSection'
import { UserOrganizationMembershipsSection } from '@/components/UserOrganizationMembershipsSection'
import { BanIcon, ShieldIcon, StarIcon } from '@/components/ActionIcons'
import { Chip, ChipGrid, EditIconButton, ListBody, ListEmpty, ListPanel, ListRow, OpenIconButton, RowTitle } from '@/components/ListKit'
import { formatGlobalRole, getUserEventSummary, hasPlatformRole } from '@/lib/organization-user-utils'
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
  users: User[]
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
      <ListPanel count={users.length} title="Members">
        {users.length === 0 ? (
          <ListEmpty>No members yet. Invite someone to get started.</ListEmpty>
        ) : (
          <ListBody itemLabel="members">
            {users.map((user) => {
              const membership = membershipByUserID.get(user.id)
              const role = membership?.roleInOrganization ?? user.role

              return (
                <ListRow
                  actions={
                    <>
                      {canManageOrgUsers ? (
                        <EditIconButton label={`Edit ${user.name}`} onClick={() => setSelectedUserId(user.id)} />
                      ) : null}
                      <OpenIconButton href={`/users/${user.id}`} label={`Open ${user.name}`} />
                    </>
                  }
                  chips={
                    <ChipGrid columns="8.5rem 6rem">
                      {hasPlatformRole(user.role) ? (
                        <Chip className="capitalize" icon={<StarIcon />} title="Platform role: works across all organizations" tone="blue">
                          {formatGlobalRole(user.role)}
                        </Chip>
                      ) : (
                        <Chip className="capitalize" icon={<ShieldIcon />} title="Role in this organization" tone="muted">
                          {role?.replace('_', ' ') ?? 'user'}
                        </Chip>
                      )}
                      {user.active === false ? (
                        <Chip icon={<BanIcon />} title="Account is switched off" tone="warning">
                          Inactive
                        </Chip>
                      ) : null}
                    </ChipGrid>
                  }
                  detail={getUserEventSummary(user.id, userEvents)}
                  href={`/users/${user.id}`}
                  key={user.id}
                  lead={<RowTitle subtitle={user.email} title={user.name} />}
                />
              )
            })}
          </ListBody>
        )}
      </ListPanel>

      <Drawer
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
        ) : null}
      </Drawer>
    </>
  )
}
