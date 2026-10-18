'use client'

import { updateUserAction } from '@/app/users/actions'
import { Field, SwitchField } from '@/components/FormFields'
import { isSuperAdminUser } from '@/lib/permissions'
import type { User } from '@/payload-types'

type UserAccountFormProps = {
  currentUser: User
  layout?: 'drawer' | 'panel'
  organizationId?: number
  targetUser: Pick<User, 'active' | 'id' | 'name' | 'preferredLanguage' | 'role'>
}

export function UserAccountForm({
  currentUser,
  layout = 'panel',
  organizationId,
  targetUser,
}: UserAccountFormProps) {
  const isSuperAdmin = isSuperAdminUser(currentUser)
  const gridClass = layout === 'panel' ? 'mt-4 grid gap-3 md:grid-cols-12' : 'grid gap-3'
  const span = (columns: 3 | 6) =>
    layout === 'panel' ? (columns === 6 ? 'md:col-span-6' : 'md:col-span-3') : ''

  return (
    <form action={updateUserAction} className="space-y-4">
      <input name="id" type="hidden" value={targetUser.id} />
      {organizationId ? <input name="organizationId" type="hidden" value={organizationId} /> : null}
      <div className={gridClass}>
        <Field className={span(6)} label="Name">
          <input className="us-input" defaultValue={targetUser.name} name="name" required />
        </Field>
        <Field className={span(3)} label="Language">
          <input className="us-input" defaultValue={targetUser.preferredLanguage ?? 'en'} name="preferredLanguage" />
        </Field>
        {isSuperAdmin ? (
          <Field className={span(3)} label="Platform role">
            <select className="us-input" defaultValue={targetUser.role ?? 'moderator'} name="role">
              <option value="super_admin">Super admin</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
          </Field>
        ) : null}
      </div>
      {isSuperAdmin ? <SwitchField defaultChecked={targetUser.active !== false} label="Active" name="active" /> : null}
      <button
        className={`${layout === 'panel' ? 'us-button-primary' : 'us-button-secondary'} px-4 py-2 text-sm font-medium`}
        type="submit"
      >
        Save
      </button>
    </form>
  )
}
