import Link from 'next/link'

import {
  approveMembershipAction,
  rejectMembershipAction,
  resendInviteForUserAction,
  upsertUserOrganizationMembershipAction,
} from '@/app/users/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { InviteUserPanel } from '@/components/InviteUserPanel'
import { ListGroupRow } from '@/components/ListGroupRow'
import { OrganizationMembersTable } from '@/components/OrganizationMembersTable'
import { TruncatedList } from '@/components/TruncatedList'
import { assignGroupTints, assignZebraTints } from '@/lib/list-group-tints'
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

  const tintedPendingRequests = assignZebraTints(
    [...pendingRequests].sort((a, b) => userLabel(a.user).localeCompare(userLabel(b.user))),
  )
  const tintedPendingInvites = assignZebraTints(
    [...pendingInvites].sort((a, b) => userLabel(a.user).localeCompare(userLabel(b.user))),
  )
  const tintedUsers = assignGroupTints(
    [...users].sort((a, b) => {
      const roleA = membershipByUserID.get(a.id)?.roleInOrganization ?? ''
      const roleB = membershipByUserID.get(b.id)?.roleInOrganization ?? ''
      const roleCompare = roleA.localeCompare(roleB)

      if (roleCompare !== 0) {
        return roleCompare
      }

      return a.name.localeCompare(b.name)
    }),
    (member) => membershipByUserID.get(member.id)?.roleInOrganization ?? '__none__',
  )

  return (
    <div className="space-y-4">
      <div className="us-panel flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
            Members, invites, and join requests for {organization.name}.
          </p>
          <Link
            className="mt-2 inline-block text-sm font-medium hover:underline"
            href={`/users?organization=${encodeURIComponent(organization.slug)}`}
            style={{ color: 'var(--us-blue-dark)' }}
          >
            Open in users hub
          </Link>
        </div>
        <InviteUserPanel
          canCreateOrganization={false}
          canSetPlatformRole={isSuperAdminUser(currentUser)}
          defaultOrganizationId={organization.id}
          hideOrganizationSelector
          organizations={[organization]}
        />
      </div>

      {assignableUsers.length > 0 ? (
        <article className="us-panel px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Add existing user
          </p>
          <form action={upsertUserOrganizationMembershipAction} className="mt-4 grid gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
            <input name="organizationId" type="hidden" value={organization.id} />
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              User
              <select
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                name="userID"
                required
                style={{ borderColor: 'var(--us-border)' }}
              >
                <option value="">Select user</option>
                {assignableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Org role
              <select className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue="moderator" name="roleInOrganization" style={{ borderColor: 'var(--us-border)' }}>
                {INVITABLE_ORGANIZATION_ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit" className="us-button-secondary px-5 py-3 text-sm font-medium">
              Add user
            </button>
          </form>
        </article>
      ) : null}

      {pendingRequests.length > 0 ? (
        <article className="us-panel px-6 py-6">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
            Pending join requests
          </h3>
          <TruncatedList className="mt-4" itemLabel="requests" listClassName="space-y-3">
            {tintedPendingRequests.map((membership) => (
              <ListGroupRow
                className="flex flex-col gap-3 rounded-3xl border px-4 py-4 md:flex-row md:items-center md:justify-between"
                key={membership.id}
                rowTint={membership.rowTint}
                style={{ borderColor: 'var(--us-border)' }}
              >
                <div>
                  <p className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                    {userLabel(membership.user)}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
                    Requested access to {organization.name}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={approveMembershipAction} id={`approve-membership-${membership.id}`}>
                    <input name="membershipId" type="hidden" value={membership.id} />
                    <input name="organizationId" type="hidden" value={organization.id} />
                  </form>
                  <form action={rejectMembershipAction} id={`reject-membership-${membership.id}`}>
                    <input name="membershipId" type="hidden" value={membership.id} />
                    <input name="organizationId" type="hidden" value={organization.id} />
                  </form>
                  <button className="us-button-primary px-4 py-2.5 text-sm font-medium" form={`approve-membership-${membership.id}`} type="submit">
                    Approve
                  </button>
                  <ConfirmSubmitButton
                    action={rejectMembershipAction}
                    className="rounded-2xl border px-4 py-2.5 text-sm font-medium"
                    confirmMessage="Reject this join request? The user will remain outside the organization."
                    formId={`reject-membership-${membership.id}`}
                    title="Reject request"
                  >
                    Reject
                  </ConfirmSubmitButton>
                </div>
              </ListGroupRow>
            ))}
          </TruncatedList>
        </article>
      ) : null}

      {pendingInvites.length > 0 ? (
        <article className="us-panel px-6 py-6">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
            Pending invites
          </h3>
          <TruncatedList className="mt-4" itemLabel="invites" listClassName="space-y-3">
            {tintedPendingInvites.map((membership) => {
              const invitedUserID = userID(membership.user)

              return (
                <ListGroupRow
                  className="flex flex-col gap-3 rounded-3xl border px-4 py-4 md:flex-row md:items-center md:justify-between"
                  key={membership.id}
                  rowTint={membership.rowTint}
                  style={{ borderColor: 'var(--us-border)' }}
                >
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                      {userLabel(membership.user)}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
                      Waiting for activation in {organization.name}
                    </p>
                  </div>
                  <form action={resendInviteForUserAction} id={`resend-invite-${invitedUserID}`}>
                    <input name="id" type="hidden" value={invitedUserID} />
                    <input name="organizationId" type="hidden" value={organization.id} />
                    <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" type="submit">
                      Resend invite
                    </button>
                  </form>
                </ListGroupRow>
              )
            })}
          </TruncatedList>
        </article>
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
        users={tintedUsers}
      />
    </div>
  )
}
