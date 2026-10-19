import Link from '@/components/OrgLink'

import { UserAccountActions } from '@/components/UserAccountActions'
import { UserAccountForm } from '@/components/UserAccountForm'
import { UserEventAssignmentsSection } from '@/components/UserEventAssignmentsSection'
import { UserOrganizationMembershipsSection } from '@/components/UserOrganizationMembershipsSection'
import { WorkspaceHeader } from '@/components/WorkspaceHeader'
import { formatTtl, getAccessLinkTtlMs } from '@/lib/access-tokens'
import { formatGlobalRole, hasPlatformRole } from '@/lib/organization-user-utils'
import { isSelfUser, type UserDetailData } from '@/lib/user-detail-data'
import type { User } from '@/payload-types'

type UserDetailPanelProps = {
  canManageUsers: boolean
  currentUser: User
  data: UserDetailData
}

export function UserDetailPanel({ canManageUsers, currentUser, data }: UserDetailPanelProps) {
  const { assignments, manageableOrganizations, memberships, targetUser } = data
  const isSelf = isSelfUser(currentUser, targetUser)
  const invitePending = targetUser.invitationStatus === 'pending'
  const inviteNote =
    invitePending && targetUser.invitedAt
      ? `Last invite sent ${new Date(targetUser.invitedAt).toLocaleString()}. Links work for ${formatTtl(getAccessLinkTtlMs('invite'))}.`
      : undefined

  return (
    <section className="space-y-4">
      <WorkspaceHeader
        actions={
          isSelf ? (
            <Link className="us-button-primary px-3 py-1.5 text-sm font-medium" href="/profile">
              My profile
            </Link>
          ) : null
        }
        chips={
          <>
            {/* Platform role only when it is special; the organization role is shown in the lists below. */}
            {targetUser.role === 'moderator' ? null : (
              <span className="us-chip us-chip-blue capitalize" title="Platform role: works across all organizations">
                {formatGlobalRole(targetUser.role)}
              </span>
            )}
            {targetUser.active === false ? <span className="us-chip us-chip-warning">Inactive</span> : null}
            {invitePending ? (
              <span className="us-chip us-chip-warning" title={inviteNote}>
                Invite pending
              </span>
            ) : null}
          </>
        }
        description={targetUser.email}
        title={targetUser.name}
      />

      {canManageUsers && !isSelf ? (
        <article className="us-panel space-y-4 px-6 py-5">
          <UserAccountForm currentUser={currentUser} layout="panel" targetUser={targetUser} />
          <UserAccountActions backToListAfterDelete formIdPrefix="user-detail" targetUser={targetUser} />
        </article>
      ) : null}

      {/* Platform admins manage every organization; their organization seats mean nothing. */}
      {hasPlatformRole(targetUser.role) ? null : (
        <UserOrganizationMembershipsSection
          canManageMemberships={canManageUsers}
          memberships={memberships}
          organizations={manageableOrganizations}
          targetUserID={targetUser.id}
        />
      )}

      <UserEventAssignmentsSection
        assignableEvents={[]}
        assignments={assignments}
        canManageAssignments={false}
        canSetAdminRole={false}
        targetUserID={targetUser.id}
      />
    </section>
  )
}
