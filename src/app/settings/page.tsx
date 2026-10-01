import type { Metadata } from 'next'
import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { importConfigAction, updateSiteSettingsAction } from '@/app/settings/actions'
import { Layout } from '@/components/Layout'
import { OrganizationSettingsPanel } from '@/components/OrganizationSettingsPanel'
import { CollapsiblePanel } from '@/components/CollapsiblePanel'
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
        {showPayloadAdmin && settings ? (
          <form action={updateSiteSettingsAction} className="us-panel space-y-5 px-6 py-6">
            <div>
              <span className="us-chip us-chip-muted">Site</span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                App-wide settings
              </h2>
              <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                Public URLs, default listener behavior, token lifetime, and the LiveKit URL shown to browser and mobile
                clients. QR codes follow the host used to open the app.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Site name
                <input
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  defaultValue={settings.siteName ?? 'ablaut'}
                  name="siteName"
                  style={{ borderColor: 'var(--us-border)' }}
                />
              </label>

              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Support email
                <input
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  defaultValue={settings.supportEmail ?? ''}
                  name="supportEmail"
                  placeholder="support@example.com"
                  style={{ borderColor: 'var(--us-border)' }}
                  type="email"
                />
              </label>
            </div>

            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              Public base URL
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={publicBaseUrl}
                name="publicBaseUrl"
                placeholder="https://studio.example.com"
                style={{ borderColor: 'var(--us-border)' }}
                type="url"
              />
              <span className="mt-1 block text-xs" style={{ color: 'var(--us-muted)' }}>
                Set with <code>NEXT_PUBLIC_APP_URL</code> / <code>PUBLIC_BASE_URL</code>; this field overrides them.
              </span>
            </label>

            <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
              LiveKit public URL
              <input
                className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                defaultValue={livekitPublicUrl}
                name="livekitPublicUrl"
                placeholder="wss://livekit.example.com"
                style={{ borderColor: 'var(--us-border)' }}
              />
              <span className="mt-1 block text-xs" style={{ color: 'var(--us-muted)' }}>
                The browser-reachable LiveKit WebSocket URL. Set with <code>LIVEKIT_URL</code> or this field.
              </span>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Default token expiry, seconds
                <input
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  defaultValue={settings.defaultTokenExpiry ?? 3600}
                  min={300}
                  name="defaultTokenExpiry"
                  style={{ borderColor: 'var(--us-border)' }}
                  type="number"
                />
              </label>

              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Default QR style
                <select
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  defaultValue={settings.defaultQrStyle ?? 'ablaut-default'}
                  name="defaultQrStyle"
                  style={{ borderColor: 'var(--us-border)' }}
                >
                  <option value="ablaut-default">ablaut default</option>
                  <option value="high-contrast">High Contrast</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label
                className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm font-medium"
                style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
              >
                <input defaultChecked={settings.allowPublicListenerPages ?? true} name="allowPublicListenerPages" type="checkbox" />
                Allow public listener pages
              </label>

              <label
                className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm font-medium"
                style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}
              >
                <input defaultChecked={settings.requireEmailVerification ?? true} name="requireEmailVerification" type="checkbox" />
                Require email verification
              </label>
            </div>

            <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
              Save settings
            </button>
          </form>
        ) : null}

        {manageableOrganizations.length === 1 ? (
          <div>
            <OrganizationSettingsPanel canDelete={false} organization={manageableOrganizations[0]} />
          </div>
        ) : manageableOrganizations.length > 1 ? (
          <article className="us-panel px-6 py-6">
            <span className="us-chip us-chip-muted">Organizations</span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              Multiple organizations
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              You manage {manageableOrganizations.length} organizations. Edit each one from the organizations list.
            </p>
            <Link className="us-button-primary mt-5 inline-flex px-4 py-2.5 text-sm font-medium" href="/organizations">
              Open organizations
            </Link>
          </article>
        ) : null}

        {showPayloadAdmin && settings ? (
          <article className="us-panel px-6 py-6">
            <span className="us-chip us-chip-muted">Mobile app</span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              Android listener app footer
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              The site footer shows the latest Android release with a QR code pointing to this server&apos;s download
              redirect. Metadata syncs from GitHub Releases on startup and can be refreshed with{' '}
              <code>npm run sync:mobile-app</code>.
            </p>
            <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
              <div>
                <dt style={{ color: 'var(--us-muted)' }}>Latest version</dt>
                <dd className="font-medium" style={{ color: 'var(--us-text)' }}>
                  {settings.mobileAppLatestVersion || 'Not synced yet'}
                </dd>
              </div>
              <div>
                <dt style={{ color: 'var(--us-muted)' }}>Git tag</dt>
                <dd className="font-medium" style={{ color: 'var(--us-text)' }}>
                  {settings.mobileAppLatestTag || '—'}
                </dd>
              </div>
              <div>
                <dt style={{ color: 'var(--us-muted)' }}>Last synced</dt>
                <dd className="font-medium" style={{ color: 'var(--us-text)' }}>
                  {settings.mobileAppLastSyncedAt ? new Date(settings.mobileAppLastSyncedAt).toLocaleString() : '—'}
                </dd>
              </div>
              <div>
                <dt style={{ color: 'var(--us-muted)' }}>GitHub repo</dt>
                <dd className="font-medium" style={{ color: 'var(--us-text)' }}>
                  {settings.mobileAppGithubRepo || 'silvansan/ablaut-App'}
                </dd>
              </div>
            </dl>
          </article>
        ) : null}

        {canTransferConfig ? (
          <CollapsiblePanel
            description="Export or import events, channels, organizations, users, and assignments. Password hashes only — never plain secrets."
            title="Data import / export"
          >
            <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              Export or import configuration as JSON. Full config includes organizations, memberships, users, events (with
              organization slug), channels, and event assignments. Speaker/listener passwords transfer only as stored
              hashes. User passwords and secrets are never exported; imported users must activate or reset their password.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="us-button-secondary px-4 py-2.5 text-sm font-medium" href="/api/config/export?scope=events">
                Export events
              </Link>
              <Link className="us-button-secondary px-4 py-2.5 text-sm font-medium" href="/api/config/export?scope=channels">
                Export channels
              </Link>
              {showPayloadAdmin ? (
                <Link className="us-button-primary px-4 py-2.5 text-sm font-medium" href="/api/config/export?scope=full">
                  Export full config
                </Link>
              ) : null}
            </div>

            <form action={importConfigAction} className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr_auto] lg:items-end">
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Import scope
                <select
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  name="scope"
                  style={{ borderColor: 'var(--us-border)' }}
                >
                  <option value="events">Events</option>
                  <option value="channels">Channels</option>
                  {showPayloadAdmin ? <option value="full">Full config</option> : null}
                </select>
              </label>
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Config JSON
                <input
                  accept="application/json,.json"
                  className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none"
                  name="configFile"
                  required
                  style={{ borderColor: 'var(--us-border)' }}
                  type="file"
                />
              </label>
              <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
                Import config
              </button>
            </form>
          </CollapsiblePanel>
        ) : null}

        {showPayloadAdmin ? (
          <article className="us-panel px-6 py-6">
            <span className="us-chip us-chip-muted">Advanced</span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              Payload back office
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              Raw collections, globals, and fields not surfaced here. Super admins only.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link className="us-button-secondary px-4 py-2.5 text-sm font-medium" href="/admin/globals/site-settings">
                Site settings in Payload
              </Link>
              <Link className="us-button-secondary px-4 py-2.5 text-sm font-medium" href="/admin">
                Open Payload admin
              </Link>
            </div>
          </article>
        ) : null}
      </div>
    </Layout>
  )
}
