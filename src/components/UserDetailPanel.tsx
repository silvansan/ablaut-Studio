import Link from 'next/link'

import {
  deleteUserAction,
  resendInviteForUserAction,
  sendPasswordResetForUserAction,
  updateUserAction,
} from '@/app/users/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { UserOrganizationMembershipsSection } from '@/components/UserOrganizationMembershipsSection'
import { formatGlobalRole } from '@/lib/organization-user-utils'
import { isSelfUser, type UserDetailData } from '@/lib/user-detail-data'
import { isSuperAdminUser } from '@/lib/permissions'
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
          <form action={updateUserAction} className="mt-5 grid gap-4 md:grid-cols-2">
            <input name="id" type="hidden" value={targetUser.id} />
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Name
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={targetUser.name}
                name="name"
                required
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Language
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={targetUser.preferredLanguage ?? 'en'}
                name="preferredLanguage"
                style={{ borderColor: 'var(--us-border)' }}
              />
            </label>
            {isSuperAdminUser(currentUser) ? (
              <>
                <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                  Platform role
                  <select
                    className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                    defaultValue={targetUser.role ?? 'moderator'}
                    name="role"
                    style={{ borderColor: 'var(--us-border)' }}
                  >
                    <option value="super_admin">Super admin</option>
                    <option value="admin">Admin</option>
                    <option value="moderator">Moderator</option>
                  </select>
                </label>
                <label className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm" style={{ color: 'var(--us-text)' }}>
                  <input defaultChecked={targetUser.active !== false} name="active" type="checkbox" />
                  <span>Active</span>
                </label>
              </>
            ) : null}
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <button className="us-button-primary px-4 py-2.5 text-sm font-medium" type="submit">
                Save user
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            <form action={sendPasswordResetForUserAction}>
              <input name="id" type="hidden" value={targetUser.id} />
              <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" type="submit">
                Send password reset
              </button>
            </form>
            {targetUser.invitationStatus === 'pending' ? (
              <form action={resendInviteForUserAction}>
                <input name="id" type="hidden" value={targetUser.id} />
                <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" type="submit">
                  Resend invite
                </button>
              </form>
            ) : null}
          </div>

          <form action={deleteUserAction} className="mt-4" id={`delete-user-${targetUser.id}`}>
            <input name="id" type="hidden" value={targetUser.id} />
            <ConfirmSubmitButton
              action={deleteUserAction}
              confirmMessage={`Delete ${targetUser.name} permanently? This cannot be undone.`}
              formId={`delete-user-${targetUser.id}`}
              title="Delete user"
            >
              Delete user
            </ConfirmSubmitButton>
          </form>
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
