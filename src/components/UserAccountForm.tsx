'use client'

import { updateUserAction } from '@/app/users/actions'
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
  const gridClass = layout === 'panel' ? 'mt-5 grid gap-4 md:grid-cols-2' : 'grid gap-3'
  const submitClass =
    layout === 'panel'
      ? 'us-button-primary px-4 py-2.5 text-sm font-medium'
      : 'us-button-secondary px-4 py-2.5 text-sm font-medium'

  return (
    <form action={updateUserAction} className={gridClass}>
      <input name="id" type="hidden" value={targetUser.id} />
      {organizationId ? <input name="organizationId" type="hidden" value={organizationId} /> : null}
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
          <label
            className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 text-sm"
            style={{ color: 'var(--us-text)' }}
          >
            <input defaultChecked={targetUser.active !== false} name="active" type="checkbox" />
            <span>Active</span>
          </label>
        </>
      ) : null}
      <div className={layout === 'panel' ? 'flex flex-wrap gap-2 md:col-span-2' : undefined}>
        <button className={submitClass} type="submit">
          Save user
        </button>
      </div>
    </form>
  )
}
