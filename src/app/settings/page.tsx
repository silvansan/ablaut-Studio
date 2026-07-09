import type { Metadata } from 'next'
import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { importConfigAction, updateSiteSettingsAction } from '@/app/settings/actions'
import { JoinOrganizationForm } from '@/components/JoinOrganizationForm'
import { Layout } from '@/components/Layout'
import { PanelDrawer } from '@/components/PanelDrawer'
import { requireAppUser } from '@/lib/app-auth'
import { pageMetadata } from '@/lib/branding'
import { hasOrganizationManagementAccess, hasPlatformWideOrganizationAccess, getJoinableOrganizations } from '@/lib/organizations'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'

export const metadata: Metadata = pageMetadata('Settings')

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await requireAppUser()
  const canTransferConfig = isAdminUser(user)
  const showPayloadAdmin = isSuperAdminUser(user)
  const showJoinOrganization = !hasPlatformWideOrganizationAccess(user)
  const payload = await getPayload({ config: configPromise })
  const isOrganizationManager = await hasOrganizationManagementAccess({ payload, user } as never)
  const joinableOrganizations = showJoinOrganization ? await getJoinableOrganizations(payload, user) : []
  const settings = showPayloadAdmin
    ? await payload.findGlobal({
        slug: 'site-settings',
        overrideAccess: true,
      })
    : null
  const publicBaseUrl = settings?.publicBaseUrl || process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ''
  const livekitPublicUrl = settings?.livekitPublicUrl || process.env.LIVEKIT_PUBLIC_URL || process.env.LIVEKIT_URL || ''

  return (
    <Layout hideHeader title="Settings">
      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        {showPayloadAdmin && settings ? (
          <form action={updateSiteSettingsAction} className="us-panel space-y-5 px-6 py-6">
            <div>
              <span className="us-chip us-chip-muted">Site settings</span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                App-wide settings
              </h2>
              <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
                These values control public URLs, default listener behavior, token lifetime, and the LiveKit URL shown to
                browser/mobile clients.
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
              <label className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm font-medium" style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}>
                <input defaultChecked={settings.allowPublicListenerPages ?? true} name="allowPublicListenerPages" type="checkbox" />
                Allow public listener pages
              </label>

              <label className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-sm font-medium" style={{ borderColor: 'var(--us-border)', color: 'var(--us-text)' }}>
                <input defaultChecked={settings.requireEmailVerification ?? true} name="requireEmailVerification" type="checkbox" />
                Require email verification
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
                Save settings
              </button>
              <Link href="/admin/globals/site-settings" className="us-button-secondary px-4 py-3 text-sm font-medium">
                Advanced Payload settings
              </Link>
            </div>
          </form>
        ) : (
          <article className="us-panel px-6 py-6">
            <span className="us-chip us-chip-muted">Your workspace</span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              {isOrganizationManager ? 'Manager settings' : 'Settings'}
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              {isOrganizationManager
                ? 'Manage your organization, team, and events. Server deployment settings are limited to super admins.'
                : 'Global site settings are managed by super admins. You can still request access to an organization below.'}
            </p>
            {isOrganizationManager ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <Link className="us-button-primary px-4 py-2.5 text-sm font-medium" href="/organizations">
                  Organizations
                </Link>
                <Link className="us-button-secondary px-4 py-2.5 text-sm font-medium" href="/users">
                  Users
                </Link>
                <Link className="us-button-secondary px-4 py-2.5 text-sm font-medium" href="/events">
                  Events
                </Link>
              </div>
            ) : (
              <Link href="/dashboard" className="mt-6 inline-flex us-button-secondary px-4 py-2.5 text-sm font-medium">
                Back to dashboard
              </Link>
            )}
            {showJoinOrganization ? (
              <div className="mt-8 border-t pt-6" style={{ borderColor: 'var(--us-border)' }}>
                <JoinOrganizationForm organizations={joinableOrganizations} />
              </div>
            ) : null}
          </article>
        )}

        {showJoinOrganization && showPayloadAdmin ? (
          <article className="us-panel px-6 py-6">
            <span className="us-chip us-chip-muted">Organizations</span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              Join another organization
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              Request access to another organization. A manager must approve your request.
            </p>
            <div className="mt-5">
              <JoinOrganizationForm organizations={joinableOrganizations} />
            </div>
          </article>
        ) : null}

        {showPayloadAdmin ? (
          <article className="us-panel px-6 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
              Deployment notes
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6" style={{ color: 'var(--us-text)' }}>
              <li>Set app URL with `NEXT_PUBLIC_APP_URL` and `PUBLIC_BASE_URL`.</li>
              <li>Set browser LiveKit URL with `LIVEKIT_URL` or the LiveKit public URL field.</li>
              <li>QR codes follow the host used to open the dashboard.</li>
            </ul>
          </article>
        ) : null}

        {showPayloadAdmin && settings ? (
          <article className="us-panel px-6 py-6">
            <span className="us-chip us-chip-muted">Mobile app</span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
              Android listener app footer
            </h2>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              The site footer shows the latest Android release with a QR code that points to this server&apos;s download
              redirect. Metadata is synced from GitHub Releases on startup and can be refreshed manually with{' '}
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
                  {settings.mobileAppLastSyncedAt
                    ? new Date(settings.mobileAppLastSyncedAt).toLocaleString()
                    : '—'}
                </dd>
              </div>
              <div>
                <dt style={{ color: 'var(--us-muted)' }}>GitHub repo</dt>
                <dd className="font-medium" style={{ color: 'var(--us-text)' }}>
                  {settings.mobileAppGithubRepo || 'silvansan/ablaut-App'}
                </dd>
              </div>
            </dl>
            {settings.mobileAppDownloadUrl ? (
              <p className="mt-4 text-sm" style={{ color: 'var(--us-muted)' }}>
                Footer download URL:{' '}
                <Link href="/api/public/mobile-app/download" style={{ color: 'var(--us-blue-dark)' }}>
                  /api/public/mobile-app/download
                </Link>
              </p>
            ) : null}
          </article>
        ) : null}

        {canTransferConfig ? (
          <div className="xl:col-span-2">
            <PanelDrawer
              description="Export or import events, channels, organizations, users, and assignments. Password hashes only — never plain secrets."
              title="Config import / export"
            >
            <p className="text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
              Export or import configuration as JSON. Full config includes organizations, organization memberships,
              users, events (with organization slug), channels, and event assignments. Speaker/listener password values
              are exported only as stored hashes. User passwords and secrets are never exported; imported users must
              activate or reset their password.
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
                <select className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" name="scope" style={{ borderColor: 'var(--us-border)' }}>
                  <option value="events">Events</option>
                  <option value="channels">Channels</option>
                  {showPayloadAdmin ? <option value="full">Full config</option> : null}
                </select>
              </label>
              <label className="block text-sm font-medium" style={{ color: 'var(--us-text)' }}>
                Config JSON
                <input accept="application/json,.json" className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-base outline-none" name="configFile" required style={{ borderColor: 'var(--us-border)' }} type="file" />
              </label>
              <button className="us-button-primary px-5 py-3 text-sm font-medium" type="submit">
                Import config
              </button>
            </form>
            </PanelDrawer>
          </div>
        ) : null}
      </section>
    </Layout>
  )
}
