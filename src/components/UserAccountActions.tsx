'use client'

import {
  deleteUserAction,
  resendInviteForUserAction,
  sendPasswordResetForUserAction,
} from '@/app/users/actions'
import { ActionFeedbackForm } from '@/components/ActionFeedbackForm'
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton'
import { TrashIcon } from '@/components/ActionIcons'
import { CopyAccessLinkButton } from '@/components/CopyAccessLinkButton'
import { SubmitButton } from '@/components/SubmitButton'
import type { User } from '@/payload-types'

type UserAccountActionsProps = {
  /** Set on the user's own page, which no longer exists once the user is deleted. */
  backToListAfterDelete?: boolean
  formIdPrefix?: string
  organizationId?: number
  showDelete?: boolean
  targetUser: Pick<User, 'id' | 'invitationStatus' | 'name'>
}

export function UserAccountActions({
  backToListAfterDelete = false,
  formIdPrefix = 'user',
  organizationId,
  showDelete = true,
  targetUser,
}: UserAccountActionsProps) {
  const resetFormId = `${formIdPrefix}-reset-${targetUser.id}`
  const resendFormId = `${formIdPrefix}-resend-${targetUser.id}`
  const deleteFormId = `${formIdPrefix}-delete-${targetUser.id}`
  const isPending = targetUser.invitationStatus === 'pending'

  return (
    <div className="flex flex-wrap items-center gap-2 border-t pt-4" style={{ borderColor: 'var(--us-border)' }}>
      <ActionFeedbackForm action={sendPasswordResetForUserAction} id={resetFormId}>
        <input name="id" type="hidden" value={targetUser.id} />
        {organizationId ? <input name="organizationId" type="hidden" value={organizationId} /> : null}
        <SubmitButton idleLabel="Send password reset" pendingLabel="Sending..." />
      </ActionFeedbackForm>
      {isPending ? (
        <ActionFeedbackForm action={resendInviteForUserAction} id={resendFormId}>
          <input name="id" type="hidden" value={targetUser.id} />
          {organizationId ? <input name="organizationId" type="hidden" value={organizationId} /> : null}
          <SubmitButton idleLabel="Resend invite" pendingLabel="Sending..." />
        </ActionFeedbackForm>
      ) : null}
      <CopyAccessLinkButton
        label={isPending ? 'Copy invite link' : 'Copy reset link'}
        organizationId={organizationId}
        userId={targetUser.id}
      />

      {showDelete ? (
        <form action={deleteUserAction} className="ml-auto" id={deleteFormId}>
          <input name="id" type="hidden" value={targetUser.id} />
          {backToListAfterDelete ? <input name="afterDelete" type="hidden" value="list" /> : null}
          {organizationId ? <input name="organizationId" type="hidden" value={organizationId} /> : null}
          <ConfirmSubmitButton
            action={deleteUserAction}
            className="us-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium"
            confirmLabel="Delete user"
            confirmMessage={`Delete ${targetUser.name} permanently? This cannot be undone.`}
            formId={deleteFormId}
            title="Delete user"
          >
            <TrashIcon />
            Delete user
          </ConfirmSubmitButton>
        </form>
      ) : null}
    </div>
  )
}
