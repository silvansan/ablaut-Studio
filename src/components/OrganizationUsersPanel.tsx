import { resendInviteForUserAction, upsertUserOrganizationMembershipAction } from '@/app/users/actions'
import { ActionFeedbackForm } from '@/components/ActionFeedbackForm'
import { CopyAccessLinkButton } from '@/components/CopyAccessLinkButton'
import { DrawerActionForm, DrawerTrigger } from '@/components/DrawerTrigger'
import { Field } from '@/components/FormFields'
import { InviteUserPanel } from '@/components/InviteUserPanel'
import { JoinRequestRow } from '@/components/JoinRequestRow'
import { ListBody, ListPanel, ListRow, RowTitle } from '@/components/ListKit'
import { OrganizationMembersTable } from '@/components/OrganizationMembersTable'
import { SubmitButton } from '@/components/SubmitButton'
import { userID, userLabel } from '@/lib/organization-user-utils'
import type { OrganizationUsersData } from '@/lib/organization-users-data'
import { INVITABLE_ORGANIZATION_ROLES } from '@/lib/organizations'
import { isSuperAdminUser } from '@/lib/permissions'
import type { Organization, User } from '@/payload-types'

type OrganizationUsersPanelProps = {
  canManageOrgUsers: boolean
  currentUser: User
  data: OrganizationUsersData
  organization: Organization
}

export function OrganizationUsersPanel({
  canManageOrgUsers,
  currentUser,
  data,
  organization,
}: OrganizationUsersPanelProps) {
  const {
    assignableEvents,
    assignableUsers,
    assignmentsByUserID,
    manageableOrganizations,
    membershipByUserID,
    organizationMembershipsByUserID,
    pendingInvites,
    pendingRequests,
    userEvents,
    users,
  } = data

  const byLabel = <T extends { user: Parameters<typeof userLabel>[0] }>(a: T, b: T) =>
    userLabel(a.user).localeCompare(userLabel(b.user))
  const sortedRequests = [...pendingRequests].sort(byLabel)
  const sortedInvites = [...pendingInvites].sort(byLabel)
  const sortedUsers = [...users].sort((a, b) => {
    const roleCompare = (membershipByUserID.get(a.id)?.roleInOrganization ?? '').localeCompare(
      membershipByUserID.get(b.id)?.roleInOrganization ?? '',
    )

    return roleCompare !== 0 ? roleCompare : a.name.localeCompare(b.name)
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {assignableUsers.length > 0 ? (
          <DrawerTrigger buttonLabel="Add existing user" variant="secondary">
            <DrawerActionForm action={upsertUserOrganizationMembershipAction} submitLabel="Add">
              <input name="organizationId" type="hidden" value={organization.id} />
              <Field label="Person">
                <select className="us-input" name="userID" required>
                  <option value="">Choose a person</option>
                  {assignableUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Role">
                <select className="us-input" defaultValue="moderator" name="roleInOrganization">
                  {INVITABLE_ORGANIZATION_ROLES.map((role) => (
                    <option key={role.value} title={role.description} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </Field>
            </DrawerActionForm>
          </DrawerTrigger>
        ) : null}
        <InviteUserPanel
          canCreateOrganization={false}
          canSetPlatformRole={isSuperAdminUser(currentUser)}
          defaultOrganizationId={organization.id}
          hideOrganizationSelector
          organizations={[organization]}
        />
      </div>

      {sortedRequests.length > 0 ? (
        <ListPanel count={sortedRequests.length} title="Join requests">
          <ListBody itemLabel="requests">
            {sortedRequests.map((membership) => (
              <JoinRequestRow
                key={membership.id}
                membership={membership}
                subtitle={`Requested access to ${organization.name}`}
              />
            ))}
          </ListBody>
        </ListPanel>
      ) : null}

      {sortedInvites.length > 0 ? (
        <ListPanel count={sortedInvites.length} title="Pending invites">
          <ListBody itemLabel="invites">
            {sortedInvites.map((membership) => {
              const invitedUserID = userID(membership.user)

              return (
                <ListRow
                  actions={
                    <>
                      <ActionFeedbackForm action={resendInviteForUserAction} id={`resend-invite-${invitedUserID}`}>
                        <input name="id" type="hidden" value={invitedUserID} />
                        <input name="organizationId" type="hidden" value={organization.id} />
                        <SubmitButton
                          className="us-button-secondary px-3 py-1.5 text-sm font-medium"
                          idleLabel="Resend invite"
                          pendingLabel="Sending..."
                        />
                      </ActionFeedbackForm>
                      <CopyAccessLinkButton label="Copy invite link" organizationId={organization.id} userId={invitedUserID} />
                    </>
                  }
                  key={membership.id}
                  lead={<RowTitle subtitle="Waiting for activation" title={userLabel(membership.user)} />}
                />
              )
            })}
          </ListBody>
        </ListPanel>
      ) : null}

      <OrganizationMembersTable
        assignableEvents={assignableEvents}
        assignmentsByUserID={assignmentsByUserID}
        canManageOrgUsers={canManageOrgUsers}
        currentUser={currentUser}
        manageableOrganizations={manageableOrganizations}
        membershipByUserID={membershipByUserID}
        organization={organization}
        organizationMembershipsByUserID={organizationMembershipsByUserID}
        userEvents={userEvents}
        users={sortedUsers}
      />
    </div>
  )
}
