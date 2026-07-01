import {
  approveMembershipAction,
  deleteUserAction,
  rejectMembershipAction,
  removeMembershipAction,
  resendInviteForUserAction,
  sendPasswordResetForUserAction,
  updateUserAction,
  upsertUserOrganizationMembershipAction,
} from '@/app/users/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { InviteUserPanel } from '@/components/InviteUserPanel'
import { ListGroupRow } from '@/components/ListGroupRow'
import { TruncatedList } from '@/components/TruncatedList'
import { UserEventAssignmentsSection } from '@/components/UserEventAssignmentsSection'
import { UserOrganizationMembershipsSection } from '@/components/UserOrganizationMembershipsSection'
import { assignGroupTints, assignZebraTints, rowTintClass } from '@/lib/list-group-tints'
import { getUserEventSummary, userID, userLabel } from '@/lib/organization-user-utils'
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
        <p className="text-sm" style={{ color: 'var(--us-muted)' }}>
          Members, invites, and join requests for {organization.name}.
        </p>
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

        {tintedUsers.length === 0 ? (
          <p className="px-3 py-4 text-sm" style={{ color: 'var(--us-muted)' }}>
            No members yet. Invite someone to get started.
          </p>
        ) : (
          <TruncatedList itemLabel="members" listClassName="space-y-3">
            {tintedUsers.map((user) => {
              const membership = membershipByUserID.get(user.id)
              const formPrefix = `user-${user.id}`

              return (
                <details key={user.id} className={`group rounded-3xl border px-4 py-4 lg:px-3 lg:py-3 ${rowTintClass(user.rowTint)}`} style={{ borderColor: 'var(--us-border)' }}>
                  <summary className="us-data-row us-data-row--cols-5 cursor-pointer list-none">
                    <div className="us-data-row__lead">
                      <span className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                        {user.name}
                      </span>
                      <span className="ml-2 us-chip us-chip-muted min-[960px]:hidden">
                        {user.role?.replace('_', ' ') ?? 'user'}
                      </span>
                    </div>
                    <div className="us-data-row__detail break-all text-sm" style={{ color: 'var(--us-muted)' }}>
                      {user.email}
                    </div>
                    <div className="us-data-row__detail text-sm" style={{ color: 'var(--us-muted)' }}>
                      {getUserEventSummary(user.id, userEvents)}
                    </div>
                    <div className="us-data-row__detail flex items-center gap-2">
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg border text-sm ${user.active === false ? 'opacity-35' : ''}`} style={{ borderColor: 'var(--us-green)', color: 'var(--us-green-dark)' }}>
                        {user.active === false ? '' : '✓'}
                      </span>
                    </div>
                    <span className="us-data-row__actions text-2xl leading-none transition group-open:rotate-180" style={{ color: 'var(--us-blue-dark)' }}>
                      ˅
                    </span>
                  </summary>

                  <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--us-border)' }}>
                    <form action={updateUserAction} className="grid gap-3 md:grid-cols-2">
                      <input name="id" type="hidden" value={user.id} />
                      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                        Name
                        <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={user.name} name="name" required style={{ borderColor: 'var(--us-border)' }} />
                      </label>
                      <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                        Language
                        <input className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={user.preferredLanguage ?? 'en'} name="preferredLanguage" style={{ borderColor: 'var(--us-border)' }} />
                      </label>
                      {isSuperAdminUser(currentUser) ? (
                        <>
                          <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                            Role
                            <select className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" defaultValue={user.role} name="role" style={{ borderColor: 'var(--us-border)' }}>
                              <option value="super_admin">Super admin</option>
                              <option value="admin">Admin</option>
                              <option value="moderator">Moderator</option>
                            </select>
                          </label>
                          <label className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
                            <input defaultChecked={user.active !== false} name="active" type="checkbox" />
                            <span>Active</span>
                          </label>
                        </>
                      ) : null}
                      <div className="flex flex-wrap gap-2 md:col-span-2">
                        <button type="submit" className="us-button-secondary px-4 py-2.5 text-sm font-medium">
                          Save user
                        </button>
                      </div>
                    </form>

                    <UserOrganizationMembershipsSection
                      canManageMemberships={canManageOrgUsers}
                      memberships={organizationMembershipsByUserID.get(user.id) ?? []}
                      organizations={manageableOrganizations}
                      targetUserID={user.id}
                    />

                    {user.role === 'moderator' || isSuperAdminUser(currentUser) ? (
                      <UserEventAssignmentsSection
                        assignments={assignmentsByUserID.get(user.id) ?? []}
                        assignableEvents={assignableEvents}
                        canManageAssignments={canManageOrgUsers}
                        canSetAdminRole={isSuperAdminUser(currentUser)}
                        targetUserID={user.id}
                      />
                    ) : null}

                    <div className="mt-3 flex flex-wrap gap-2">
                      <form action={sendPasswordResetForUserAction} id={`${formPrefix}-reset`}>
                        <input name="id" type="hidden" value={user.id} />
                        <input name="organizationId" type="hidden" value={organization.id} />
                        <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" type="submit">
                          Send password reset
                        </button>
                      </form>
                      {user.invitationStatus === 'pending' ? (
                        <form action={resendInviteForUserAction} id={`${formPrefix}-resend`}>
                          <input name="id" type="hidden" value={user.id} />
                          <input name="organizationId" type="hidden" value={organization.id} />
                          <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" type="submit">
                            Resend invite
                          </button>
                        </form>
                      ) : null}
                    </div>

                    {membership ? (
                      <form action={removeMembershipAction} className="mt-4" id={`${formPrefix}-remove-membership`}>
                        <input name="membershipId" type="hidden" value={membership.id} />
                        <input name="organizationId" type="hidden" value={organization.id} />
                        <ConfirmSubmitButton
                          action={removeMembershipAction}
                          confirmMessage={`Remove ${user.name} from ${organization.name}? Their global account will remain.`}
                          formId={`${formPrefix}-remove-membership`}
                          title="Remove from organization"
                        >
                          Remove from organization
                        </ConfirmSubmitButton>
                      </form>
                    ) : null}

                    {String(user.id) !== String(currentUser.id) ? (
                      <form action={deleteUserAction} className="mt-4" id={`${formPrefix}-delete`}>
                        <input name="id" type="hidden" value={user.id} />
                        <input name="organizationId" type="hidden" value={organization.id} />
                        <ConfirmSubmitButton
                          action={deleteUserAction}
                          confirmMessage={`Delete ${user.name} permanently? This cannot be undone.`}
                          formId={`${formPrefix}-delete`}
                          title="Delete user"
                        >
                          Delete user
                        </ConfirmSubmitButton>
                      </form>
                    ) : null}
                  </div>
                </details>
              )
            })}
          </TruncatedList>
        )}
      </article>
    </div>
  )
}
