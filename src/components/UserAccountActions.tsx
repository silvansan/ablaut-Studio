'use client'

import {
  deleteUserAction,
  resendInviteForUserAction,
  sendPasswordResetForUserAction,
} from '@/app/users/actions'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import type { User } from '@/payload-types'

type UserAccountActionsProps = {
  formIdPrefix?: string
  organizationId?: number
  showDelete?: boolean
  targetUser: Pick<User, 'id' | 'invitationStatus' | 'name'>
}

export function UserAccountActions({
  formIdPrefix = 'user',
  organizationId,
  showDelete = true,
  targetUser,
}: UserAccountActionsProps) {
  const resetFormId = `${formIdPrefix}-reset-${targetUser.id}`
  const resendFormId = `${formIdPrefix}-resend-${targetUser.id}`
  const deleteFormId = `${formIdPrefix}-delete-${targetUser.id}`

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <form action={sendPasswordResetForUserAction} id={resetFormId}>
          <input name="id" type="hidden" value={targetUser.id} />
          {organizationId ? <input name="organizationId" type="hidden" value={organizationId} /> : null}
          <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" type="submit">
            Send password reset
          </button>
        </form>
        {targetUser.invitationStatus === 'pending' ? (
          <form action={resendInviteForUserAction} id={resendFormId}>
            <input name="id" type="hidden" value={targetUser.id} />
            {organizationId ? <input name="organizationId" type="hidden" value={organizationId} /> : null}
            <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" type="submit">
              Resend invite
            </button>
          </form>
        ) : null}
      </div>

      {showDelete ? (
        <form action={deleteUserAction} id={deleteFormId}>
          <input name="id" type="hidden" value={targetUser.id} />
          {organizationId ? <input name="organizationId" type="hidden" value={organizationId} /> : null}
          <ConfirmSubmitButton
            action={deleteUserAction}
            confirmMessage={`Delete ${targetUser.name} permanently? This cannot be undone.`}
            formId={deleteFormId}
            title="Delete user"
          >
            Delete user
          </ConfirmSubmitButton>
        </form>
      ) : null}
    </div>
  )
}
