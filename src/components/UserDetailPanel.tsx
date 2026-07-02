import Link from 'next/link'

import { UserAccountActions } from '@/components/UserAccountActions'
import { UserAccountForm } from '@/components/UserAccountForm'
import { UserOrganizationMembershipsSection } from '@/components/UserOrganizationMembershipsSection'
import { formatGlobalRole } from '@/lib/organization-user-utils'
import { isSelfUser, type UserDetailData } from '@/lib/user-detail-data'
import type { User } from '@/payload-types'

type UserDetailPanelProps = {
  canManageUsers: boolean
  currentUser: User
  data: UserDetailData
}

export function UserDetailPanel({ canManageUsers, currentUser, data }: UserDetailPanelProps) {
  const { assignments, manageableOrganizations, memberships, targetUser, userEvents } = data
  const isSelf = isSelfUser(currentUser, targetUser)

  return (
    <section className="space-y-4">
      <div className="us-panel flex flex-wrap items-center gap-2 px-6 py-5">
        <Link className="us-button-secondary px-4 py-2.5 text-sm font-medium" href="/users">
          Back to users
        </Link>
        {isSelf ? (
          <Link className="us-button-primary px-4 py-2.5 text-sm font-medium" href="/profile">
            Open my profile
          </Link>
        ) : null}
      </div>

      <article className="us-panel px-6 py-6">
        <div className="flex flex-wrap items-start gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              {targetUser.name}
            </h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--us-muted)' }}>
              {targetUser.email}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <span className="us-chip us-chip-blue capitalize">{formatGlobalRole(targetUser.role)}</span>
            {targetUser.active === false ? <span className="us-chip us-chip-warning">Inactive</span> : null}
            {targetUser.invitationStatus === 'pending' ? (
              <span className="us-chip us-chip-warning">Invite pending</span>
            ) : null}
          </div>
        </div>

        <p className="mt-4 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
          {userEvents.length > 0 ? `Assigned events: ${userEvents.join(', ')}` : 'No assigned events in your organizations.'}
        </p>
      </article>

      {canManageUsers && !isSelf ? (
        <article className="us-panel px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Account
          </p>
          <UserAccountForm currentUser={currentUser} layout="panel" targetUser={targetUser} />
          <UserAccountActions formIdPrefix="user-detail" targetUser={targetUser} />
        </article>
      ) : null}

      {canManageUsers ? (
        <article className="us-panel px-6 py-6">
          <UserOrganizationMembershipsSection
            canManageMemberships={canManageUsers}
            memberships={memberships}
            organizations={manageableOrganizations}
            targetUserID={targetUser.id}
          />
        </article>
      ) : (
        <article className="us-panel px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Organization access
          </p>
          {memberships.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm" style={{ color: 'var(--us-text)' }}>
              {memberships.map((membership) => (
                <li key={membership.id}>
                  {typeof membership.organization === 'object' ? membership.organization.name : 'Organization'} ·{' '}
                  <span className="capitalize">{membership.roleInOrganization}</span> · {membership.status}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm" style={{ color: 'var(--us-muted)' }}>
              Not assigned to any of your organizations yet.
            </p>
          )}
        </article>
      )}

      {assignments.length > 0 ? (
        <article className="us-panel px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Event assignments
          </p>
          <ul className="mt-4 space-y-2 text-sm" style={{ color: 'var(--us-text)' }}>
            {assignments.map((assignment) => (
              <li key={assignment.id}>
                {typeof assignment.event === 'object' ? assignment.event.title : `Event ${assignment.event}`} ·{' '}
                <span className="capitalize">{assignment.roleForEvent}</span>
              </li>
            ))}
          </ul>
        </article>
      ) : null}
    </section>
  )
}
