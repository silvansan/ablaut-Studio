import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { changeOwnPasswordAction, logoutAction, updateProfileAction } from '@/app/profile/actions'
import { JoinOrganizationForm } from '@/components/JoinOrganizationForm'
import { Layout } from '@/components/Layout'
import { requireAppUser } from '@/lib/app-auth'
import { pageMetadata } from '@/lib/branding'
import { getJoinableOrganizations, hasPlatformWideOrganizationAccess } from '@/lib/organizations'

export const metadata: Metadata = pageMetadata('My profile')

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await requireAppUser()
  const canJoinOrganizations = !hasPlatformWideOrganizationAccess(user)
  const joinableOrganizations = canJoinOrganizations
    ? await getJoinableOrganizations(await getPayload({ config: configPromise }), user)
    : []

  return (
    <Layout hideHeader title="My profile">
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <article className="us-panel px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Profile
          </p>

          <form action={updateProfileAction} className="mt-5 space-y-4">
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Email
              <input
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-base outline-none"
                disabled
                style={{ backgroundColor: 'var(--us-bg)', borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}
                value={user.email}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Name
                <input
                  className="us-input mt-2"
                  defaultValue={user.name}
                  name="name"
                  required
                />
              </label>

              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Preferred language
                <input
                  className="us-input mt-2"
                  defaultValue={user.preferredLanguage ?? 'en'}
                  name="preferredLanguage"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
                Save profile
              </button>
              <span className="us-chip us-chip-muted capitalize">{user.role?.replace('_', ' ')}</span>
              {user.active === false ? <span className="us-chip us-chip-warning">Inactive</span> : null}
            </div>
          </form>
        </article>

        <article className="us-panel px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Security
          </p>

          <form action={changeOwnPasswordAction} className="mt-5 space-y-4">
            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Current password
              <input
                autoComplete="current-password"
                className="us-input mt-2"
                name="currentPassword"
                required
                type="password"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                New password
                <input
                  autoComplete="new-password"
                  className="us-input mt-2"
                  name="newPassword"
                  required
                  type="password"
                />
              </label>

              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Confirm new password
                <input
                  autoComplete="new-password"
                  className="us-input mt-2"
                  name="confirmPassword"
                  required
                  type="password"
                />
              </label>
            </div>

            <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
              Change password
            </button>
          </form>
        </article>

        {canJoinOrganizations ? (
          <article className="us-panel px-6 py-6 xl:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Organizations
            </p>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              A manager approves your request before you see its events.
            </p>
            <div className="mt-5">
              <JoinOrganizationForm organizations={joinableOrganizations} />
            </div>
          </article>
        ) : null}

        <article className="us-panel px-6 py-6 xl:col-span-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <form action={logoutAction}>
              <button className="rounded-2xl border px-5 py-3 text-sm font-medium" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }} type="submit">
                Logout
              </button>
            </form>
          </div>
        </article>
      </section>
    </Layout>
  )
}
