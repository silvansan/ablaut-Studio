import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { changeOwnPasswordAction, logoutAction, updateProfileAction } from '@/app/profile/actions'
import { Field } from '@/components/FormFields'
import { JoinOrganizationForm } from '@/components/JoinOrganizationForm'
import { Layout } from '@/components/Layout'
import { SettingsPanel } from '@/components/SettingsPanel'
import { WorkspaceHeader } from '@/components/WorkspaceHeader'
import { requireAppUser } from '@/lib/app-auth'
import { pageMetadata } from '@/lib/branding'
import { formatGlobalRole } from '@/lib/organization-user-utils'
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
      <section className="space-y-4">
        <WorkspaceHeader
          actions={
            <form action={logoutAction}>
              <button
                className="us-button-secondary px-3 py-1.5 text-sm font-medium"
                style={{ color: 'var(--us-danger)' }}
                type="submit"
              >
                Sign out
              </button>
            </form>
          }
          chips={
            <>
              {/* Same rule as the user page: the platform role only when it is special. */}
              {user.role === 'moderator' ? null : (
                <span className="us-chip us-chip-blue capitalize" title="Platform role: works across all organizations">
                  {formatGlobalRole(user.role)}
                </span>
              )}
              {user.active === false ? <span className="us-chip us-chip-warning">Inactive</span> : null}
            </>
          }
          description={user.email}
          title={user.name}
        />

        <div className="grid gap-4 xl:grid-cols-2">
          <SettingsPanel title="Profile">
            <form action={updateProfileAction} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-12">
                <Field className="md:col-span-8" label="Name">
                  <input className="us-input" defaultValue={user.name} name="name" required />
                </Field>
                <Field className="md:col-span-4" hint="Language code, for example en or de." label="Language">
                  <input className="us-input" defaultValue={user.preferredLanguage ?? 'en'} name="preferredLanguage" />
                </Field>
              </div>
              <button className="us-button-primary px-4 py-2 text-sm font-medium" type="submit">
                Save
              </button>
            </form>
          </SettingsPanel>

          <SettingsPanel title="Password">
            <form action={changeOwnPasswordAction} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Current">
                  <input autoComplete="current-password" className="us-input" name="currentPassword" required type="password" />
                </Field>
                <Field label="New">
                  <input autoComplete="new-password" className="us-input" name="newPassword" required type="password" />
                </Field>
                <Field label="Confirm new">
                  <input autoComplete="new-password" className="us-input" name="confirmPassword" required type="password" />
                </Field>
              </div>
              <button className="us-button-primary px-4 py-2 text-sm font-medium" type="submit">
                Change password
              </button>
            </form>
          </SettingsPanel>
        </div>

        {canJoinOrganizations ? (
          <SettingsPanel hint="A manager approves your request before you see its events." title="Join an organization">
            <JoinOrganizationForm organizations={joinableOrganizations} />
          </SettingsPanel>
        ) : null}
      </section>
    </Layout>
  )
}
