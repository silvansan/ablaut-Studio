import { approveMembershipAction, rejectMembershipAction } from '@/app/users/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { ListRow, RowTitle } from '@/components/ListKit'
import { userLabel } from '@/lib/organization-user-utils'
import type { OrganizationMembership } from '@/payload-types'

type JoinRequestRowProps = {
  membership: OrganizationMembership
  returnPath?: string
  /** Second line; defaults to the organization the person asked to join. */
  subtitle?: string
}

/** One "asked to join" row with Approve and Reject, the same everywhere requests appear. */
export function JoinRequestRow({ membership, returnPath, subtitle }: JoinRequestRowProps) {
  const organization =
    typeof membership.organization === 'object' && membership.organization ? membership.organization : null
  const organizationId = organization?.id ?? (typeof membership.organization === 'number' ? membership.organization : '')
  const rejectFormId = `reject-membership-${membership.id}`

  const hidden = (
    <>
      <input name="membershipId" type="hidden" value={membership.id} />
      <input name="organizationId" type="hidden" value={organizationId} />
      {returnPath ? <input name="returnPath" type="hidden" value={returnPath} /> : null}
    </>
  )

  return (
    <ListRow
      actions={
        <>
          <form action={approveMembershipAction}>
            {hidden}
            <button className="us-button-primary px-3 py-1.5 text-sm font-medium" type="submit">
              Approve
            </button>
          </form>
          <form action={rejectMembershipAction} id={rejectFormId}>
            {hidden}
            <ConfirmSubmitButton
              action={rejectMembershipAction}
              className="us-button-secondary px-3 py-1.5 text-sm font-medium"
              confirmLabel="Reject"
              confirmMessage="Reject this request? The person stays outside the organization."
              formId={rejectFormId}
              title="Reject request"
            >
              Reject
            </ConfirmSubmitButton>
          </form>
        </>
      }
      lead={<RowTitle subtitle={subtitle ?? organization?.name ?? 'Organization'} title={userLabel(membership.user)} />}
    />
  )
}
