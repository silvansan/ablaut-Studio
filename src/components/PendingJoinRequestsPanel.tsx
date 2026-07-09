import Link from 'next/link'

import { approveMembershipAction, rejectMembershipAction } from '@/app/users/actions'
import type { OrganizationMembership } from '@/payload-types'
import { userLabel } from '@/lib/organization-user-utils'

type PendingJoinRequestsPanelProps = {
  memberships: OrganizationMembership[]
  returnPath?: string
}

export function PendingJoinRequestsPanel({ memberships, returnPath = '/users' }: PendingJoinRequestsPanelProps) {
  if (memberships.length === 0) {
    return null
  }

  return (
    <article className="us-panel px-5 py-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
        Pending join requests
      </p>
      <p className="mt-2 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
        Approve or reject people who asked to join your organization.
      </p>
      <ul className="mt-4 space-y-2">
        {memberships.map((membership) => {
          const organization =
            typeof membership.organization === 'object' && membership.organization ? membership.organization : null

          return (
            <li
              className="flex flex-col gap-3 rounded-2xl border px-4 py-4 md:flex-row md:items-center md:justify-between"
              key={membership.id}
              style={{ borderColor: 'var(--us-border)' }}
            >
              <div>
                <p className="font-semibold" style={{ color: 'var(--us-green-dark)' }}>
                  {userLabel(membership.user)}
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--us-muted)' }}>
                  {organization?.name ?? 'Organization'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={approveMembershipAction}>
                  <input name="membershipId" type="hidden" value={membership.id} />
                  <input name="organizationId" type="hidden" value={organization?.id ?? ''} />
                  <input name="returnPath" type="hidden" value={returnPath} />
                  <button className="us-button-primary px-3 py-2 text-sm font-medium" type="submit">
                    Approve
                  </button>
                </form>
                <form action={rejectMembershipAction}>
                  <input name="membershipId" type="hidden" value={membership.id} />
                  <input name="organizationId" type="hidden" value={organization?.id ?? ''} />
                  <input name="returnPath" type="hidden" value={returnPath} />
                  <button className="us-button-secondary px-3 py-2 text-sm font-medium" type="submit">
                    Reject
                  </button>
                </form>
                {organization?.slug ? (
                  <Link
                    className="us-button-secondary px-3 py-2 text-sm font-medium"
                    href={`/organizations/${organization.slug}?tab=users`}
                  >
                    Org users
                  </Link>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
    </article>
  )
}
