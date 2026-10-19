import type { Metadata } from 'next'
import Link from '@/components/OrgLink'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { importConfigAction, updateSiteSettingsAction } from '@/app/settings/actions'
import { AndroidIcon, DownloadIcon, OpenLinkIcon } from '@/components/ActionIcons'
import { Field, SwitchField } from '@/components/FormFields'
import { Layout } from '@/components/Layout'
import { OrganizationSettingsPanel } from '@/components/OrganizationSettingsPanel'
import { PageHeader } from '@/components/PageHeader'
import { SettingsPanel } from '@/components/SettingsPanel'
import { requireAppUser } from '@/lib/app-auth'
import { pageMetadata } from '@/lib/branding'
import { getManageableOrganizations } from '@/lib/organization-data'
import { hasOrganizationManagementAccess } from '@/lib/organizations'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'

export const metadata: Metadata = pageMetadata('Settings')

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await requireAppUser()
  const payload = await getPayload({ config: configPromise })
  const showPayloadAdmin = isSuperAdminUser(user)
  const canTransferConfig = isAdminUser(user)
  const isOrganizationManager = await hasOrganizationManagementAccess({ payload, user } as never)

  if (!showPayloadAdmin && !canTransferConfig && !isOrganizationManager) {
    return (
      <Layout hideHeader title="Settings">
        <article className="us-panel px-6 py-6">
          <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            Settings are managed by administrators. Manage your own account from{' '}
            <Link href="/profile" style={{ color: 'var(--us-blue-dark)' }}>
              My profile
            </Link>
            .
          </p>
        </article>
      </Layout>
    )
  }

  const manageableOrganizations =
    showPayloadAdmin || isOrganizationManager ? await getManageableOrganizations() : []
  const settings = showPayloadAdmin
    ? await payload.findGlobal({ slug: 'site-settings', overrideAccess: true })
    : null
  const publicBaseUrl =
    settings?.publicBaseUrl || process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  const livekitPublicUrl =
    settings?.livekitPublicUrl || process.env.LIVEKIT_PUBLIC_URL || process.env.LIVEKIT_URL || ''

  return (
    <Layout hideHeader title="Settings">
      <div className="space-y-4">
        <PageHeader title="Settings" />

        {showPayloadAdmin && settings ? (
          <SettingsPanel hint="Applies to every organization on this server." title="Site">
            <form action={updateSiteSettingsAction} className="space-y-4">
              <div className="grid gap-3 md:grid-cols-12">
                <Field className="md:col-span-6" label="Site name">
                  <input className="us-input" defaultValue={settings.siteName ?? 'ablaut'} name="siteName" />
                </Field>
                <Field className="md:col-span-6" label="Support email">
                  <input
                    className="us-input"
                    defaultValue={settings.supportEmail ?? ''}
                    name="supportEmail"
                    placeholder="support@example.com"
                    type="email"
                  />
                </Field>
                <Field
                  className="md:col-span-6"
                  hint="Overrides NEXT_PUBLIC_APP_URL / PUBLIC_BASE_URL. QR codes follow the address the app was opened with."
                  label="Public base URL"
                >
                  <input
                    className="us-input"
                    defaultValue={publicBaseUrl}
                    name="publicBaseUrl"
                    placeholder="https://studio.example.com"
                    type="url"
                  />
                </Field>
                <Field
                  className="md:col-span-6"
                  hint="The LiveKit WebSocket address browsers and the app connect to. Overrides LIVEKIT_URL."
                  label="LiveKit public URL"
                >
                  <input
                    className="us-input"
                    defaultValue={livekitPublicUrl}
                    name="livekitPublicUrl"
                    placeholder="wss://livekit.example.com"
                  />
                </Field>
                <Field className="md:col-span-6" hint="Minimum 300." label="Token expiry (seconds)">
                  <input
                    className="us-input"
                    defaultValue={settings.defaultTokenExpiry ?? 3600}
                    min={300}
                    name="defaultTokenExpiry"
                    type="number"
                  />
                </Field>
                <Field className="md:col-span-6" label="QR style">
                  <select className="us-input" defaultValue={settings.defaultQrStyle ?? 'ablaut-default'} name="defaultQrStyle">
                    <option value="ablaut-default">ablaut default</option>
                    <option value="high-contrast">High contrast</option>
                  </select>
                </Field>
              </div>
              <div>
                <SwitchField
                  defaultChecked={settings.allowPublicListenerPages ?? true}
                  label="Public listener pages"
                  name="allowPublicListenerPages"
                />
                <SwitchField
                  defaultChecked={settings.requireEmailVerification ?? true}
                  label="Require email verification"
                  name="requireEmailVerification"
                />
              </div>
              <button className="us-button-primary px-4 py-2 text-sm font-medium" type="submit">
                Save
              </button>
            </form>
          </SettingsPanel>
        ) : null}

        {manageableOrganizations.length === 1 ? (
          <OrganizationSettingsPanel canDelete={false} organization={manageableOrganizations[0]} />
        ) : manageableOrganizations.length > 1 ? (
          <SettingsPanel
            actions={
              <Link className="us-button-secondary px-3 py-1.5 text-sm font-medium" href="/organizations">
                Organizations
              </Link>
            }
            hint={`You manage ${manageableOrganizations.length} organizations. Each has its own settings.`}
            title="Organizations"
          />
        ) : null}

        {showPayloadAdmin && settings ? (
          <SettingsPanel
            hint="Shown in the footer with a download QR. Synced from GitHub Releases on startup, or with npm run sync:mobile-app."
            title="Android app"
          >
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Version', settings.mobileAppLatestVersion || 'Not synced yet'],
                ['Tag', settings.mobileAppLatestTag || '—'],
                [
                  'Last synced',
                  settings.mobileAppLastSyncedAt ? new Date(settings.mobileAppLastSyncedAt).toLocaleString() : '—',
                ],
                ['Repository', settings.mobileAppGithubRepo || 'silvansan/ablaut-App'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs" style={{ color: 'var(--us-muted)' }}>
                    {label}
                  </dt>
                  <dd className="inline-flex items-center gap-1.5 font-medium" style={{ color: 'var(--us-text)' }}>
                    {label === 'Version' ? <AndroidIcon /> : null}
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </SettingsPanel>
        ) : null}

        {canTransferConfig ? (
          <SettingsPanel
            actions={
              <>
                <Link className="us-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium" href="/api/config/export?scope=events">
                  <DownloadIcon />
                  Events
                </Link>
                <Link className="us-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium" href="/api/config/export?scope=channels">
                  <DownloadIcon />
                  Channels
                </Link>
                {showPayloadAdmin ? (
                  <Link className="us-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium" href="/api/config/export?scope=full">
                    <DownloadIcon />
                    Full config
                  </Link>
                ) : null}
              </>
            }
            hint="JSON export and import of organizations, members, users, events, channels and team assignments. Speaker and listener passwords move only as hashes; user passwords never leave the server, so imported users set a new one."
            title="Import / export"
          >
            <form action={importConfigAction} className="grid gap-3 md:grid-cols-12 md:items-end">
              <Field className="md:col-span-3" label="Import">
                <select className="us-input" name="scope">
                  <option value="events">Events</option>
                  <option value="channels">Channels</option>
                  {showPayloadAdmin ? <option value="full">Full config</option> : null}
                </select>
              </Field>
              <Field className="md:col-span-7" label="JSON file">
                <input accept="application/json,.json" className="us-input" name="configFile" required type="file" />
              </Field>
              <button className="us-button-primary px-4 py-2 text-sm font-medium md:col-span-2" type="submit">
                Import
              </button>
            </form>
          </SettingsPanel>
        ) : null}

        {showPayloadAdmin ? (
          <SettingsPanel
            actions={
              <>
                <Link className="us-button-secondary px-3 py-1.5 text-sm font-medium" href="/admin/globals/site-settings">
                  Site settings
                </Link>
                <Link className="us-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium" href="/admin">
                  <OpenLinkIcon />
                  Payload admin
                </Link>
              </>
            }
            hint="Raw collections and fields not shown in this app. Super admins only."
            title="Back office"
          />
        ) : null}
      </div>
    </Layout>
  )
}
