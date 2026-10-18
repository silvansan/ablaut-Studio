import type { ReactNode } from 'react'
import configPromise from '@payload-config'
import Link from '@/components/OrgLink'
import { notFound, redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { GitHubIcon, LicenseIcon } from './ActionIcons'
import { AppDownloadFooterLink } from './AppDownloadFooterLink'
import { AppSidebar } from './AppSidebar'
import { Breadcrumbs } from './Breadcrumbs'
import { MobileAppChrome } from './MobileAppChrome'
import { OrgProvider } from './OrgLink'
import type { SidebarNavItem } from './SidebarNav'
import { isFeatureEnabled } from '@/features/types'
import { getCurrentAppUser, requireAppUser } from '@/lib/app-auth'
import { APP_PRONUNCIATION, APP_PRODUCT_NAME, APP_STUDIO_NAME } from '@/lib/branding'
import { getRequestBaseUrl } from '@/lib/links'
import { loadPublicMobileAppRelease } from '@/lib/mobile-app-release'
import {
  getAccessibleOrganizations,
  getCurrentOrganization,
  getRequestScope,
  getRequestUrl,
  resolveCanonicalOrganization,
} from '@/lib/org-context'
import { isOrgScopedInternalPath, toPublicPath } from '@/lib/org-paths'
import {
  countPendingJoinRequestsForUser,
  hasOrganizationManagementAccess,
  shouldHideBetaBannerForUser,
} from '@/lib/organizations'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'
import { generateBrandedDownloadQrDataUrl } from '@/lib/qrcode'
import { getDefaultQrStyle } from '@/lib/qr-settings'
import { getEventNavFlyout } from '@/lib/recent-events'

type LayoutProps = {
  children: ReactNode
  hideBetaBanner?: boolean
  hideHeader?: boolean
  requireAuth?: boolean
  title?: string
}

const RECENT_EVENTS_IN_SIDEBAR = 6

/**
 * Old, unscoped admin URLs (`/events/x`, bookmarks, server-action redirects) move to their
 * organization-scoped form. Returns the URL to redirect to, or null when the URL is already canonical.
 */
async function canonicalRedirectTarget(user: NonNullable<Awaited<ReturnType<typeof getCurrentAppUser>>>) {
  const url = await getRequestUrl()

  if (!url) {
    return null
  }

  const path = url.split(/[?#]/)[0] ?? url

  if (isOrgScopedInternalPath(path)) {
    const organization = await resolveCanonicalOrganization(user, path)
    const target = organization?.publicKey ? toPublicPath(url, organization.publicKey) : null

    return target && target !== url ? target : null
  }

  const target = toPublicPath(url, null)

  return target !== url ? target : null
}

export async function Layout({
  children,
  hideBetaBanner = false,
  hideHeader = false,
  requireAuth = true,
  title,
}: LayoutProps) {
  const payload = await getPayload({ config: configPromise })
  const user = requireAuth ? await requireAppUser() : await getCurrentAppUser()
  const scope = await getRequestScope()
  const currentOrganization = user ? await getCurrentOrganization() : null

  if (user && requireAuth) {
    if (scope.kind === 'org' && !currentOrganization) {
      notFound()
    }

    if (scope.kind === 'none') {
      const target = await canonicalRedirectTarget(user)

      if (target) {
        redirect(target)
      }
    }
  }

  const mobileRelease = await loadPublicMobileAppRelease(payload, await getRequestBaseUrl())
  const qrStyle = await getDefaultQrStyle()
  const mobileAppQrDataUrl =
    mobileRelease?.latestVersion && mobileRelease.downloadPageUrl
      ? await generateBrandedDownloadQrDataUrl({
          style: qrStyle,
          url: mobileRelease.downloadPageUrl,
          version: mobileRelease.latestVersion,
        })
      : null

  const showAppMenu = Boolean(user)
  const isSuperAdmin = user ? isSuperAdminUser(user) : false
  const isAdmin = user ? isAdminUser(user) : false
  const isOrganizationManager = user
    ? await hasOrganizationManagementAccess({ payload, user } as never)
    : false
  const canManage = isAdmin || isOrganizationManager
  const accessibleOrganizations = user ? await getAccessibleOrganizations(user) : []
  const eventFlyout = user ? await getEventNavFlyout(user) : null
  const pendingJoinRequestCount =
    user && isOrganizationManager ? await countPendingJoinRequestsForUser(payload, user) : 0
  const suppressBetaBanner = user ? await shouldHideBetaBannerForUser(payload, user) : false
  const showBetaBanner = Boolean(user && !hideBetaBanner && !suppressBetaBanner)
  const currentYear = new Date().getFullYear()

  const navItems: SidebarNavItem[] = [
    { href: '/events', label: 'Events' },
    ...(canManage
      ? [
          { badge: pendingJoinRequestCount > 0 ? pendingJoinRequestCount : undefined, href: '/users', label: 'People' },
          { href: '/settings', label: 'Settings' },
        ]
      : []),
  ]

  const recentItems: SidebarNavItem[] = (eventFlyout?.items ?? [])
    .slice(0, RECENT_EVENTS_IN_SIDEBAR)
    .map((item) => ({ href: item.href, label: item.label, status: item.status }))

  const showOrganizationsLink =
    isFeatureEnabled('organizations') && isOrganizationManager && (isSuperAdmin || accessibleOrganizations.length > 1)
  const platformItems: SidebarNavItem[] = [
    ...(showOrganizationsLink ? [{ href: '/platform/organizations', label: 'Organizations' }] : []),
    ...(isSuperAdmin
      ? [
          { href: '/platform/users', label: 'All users' },
          { href: '/platform/server', label: 'Server health' },
          { href: '/admin', label: 'Payload admin' },
        ]
      : []),
  ]

  const organizationOptions = accessibleOrganizations
    .filter((organization): organization is typeof organization & { publicKey: string } => Boolean(organization.publicKey))
    .map((organization) => ({ key: organization.publicKey, name: organization.name }))

  const sidebar = (
    <AppSidebar
      currentKey={currentOrganization?.publicKey ?? null}
      email={user?.email ?? ''}
      navItems={navItems}
      organizations={organizationOptions}
      platformItems={platformItems}
      recentItems={recentItems}
    />
  )

  return (
    <OrgProvider orgKey={currentOrganization?.publicKey ?? null}>
      <div className="min-h-screen xl:flex">
        {showAppMenu ? (
          <aside className="us-sidebar-shell hidden xl:block">{sidebar}</aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <MobileAppChrome
            orgName={currentOrganization?.name ?? null}
            showSidebar={showAppMenu}
            sidebar={sidebar}
            tabs={navItems}
          >
            {showAppMenu ? (
              <div className="us-topbar hidden xl:flex">
                <Breadcrumbs
                  orgKey={currentOrganization?.publicKey ?? null}
                  orgName={currentOrganization?.name ?? null}
                  title={title}
                />
              </div>
            ) : null}

            <div className="us-content mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-4 md:px-6 md:py-6">
              {hideHeader ? null : (
                <header>
                  <p className="text-xs font-semibold" style={{ color: 'var(--us-blue-dark)' }}>
                    {APP_STUDIO_NAME}
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                    {title ?? 'Event audio control'}
                  </h1>
                </header>
              )}

              <main className="min-w-0 flex-1">
                {showBetaBanner ? (
                  <div
                    className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--us-card)', borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}
                  >
                    <span>
                      <span className="us-chip us-chip-blue mr-2">Beta</span>
                      ablaut-Studio is in active development.
                    </span>
                    <Link className="font-medium hover:underline" href="/feedback" style={{ color: 'var(--us-blue-dark)' }}>
                      Send feedback
                    </Link>
                  </div>
                ) : null}
                {children}
              </main>

              <footer className="border-t pt-4 text-xs" style={{ borderColor: 'var(--us-border)', color: 'var(--us-muted)' }}>
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <p>
                    Copyright © {currentYear} {APP_STUDIO_NAME} · {APP_PRODUCT_NAME} {APP_PRONUNCIATION}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <a
                      className="inline-flex items-center gap-1.5 font-medium"
                      href="https://github.com/silvansan/ablaut-Studio"
                      rel="noreferrer"
                      style={{ color: 'var(--us-blue-dark)' }}
                      target="_blank"
                    >
                      <GitHubIcon />
                      Source code
                    </a>
                    <a
                      className="inline-flex items-center gap-1.5 font-medium"
                      href="https://github.com/silvansan/ablaut-Studio/blob/main/LICENSE"
                      rel="noreferrer"
                      style={{ color: 'var(--us-blue-dark)' }}
                      target="_blank"
                    >
                      <LicenseIcon />
                      License: AGPLv3
                    </a>
                    {mobileRelease?.latestVersion && mobileAppQrDataUrl ? (
                      <AppDownloadFooterLink
                        downloadPageUrl={mobileRelease.downloadPageUrl}
                        latestVersion={mobileRelease.latestVersion}
                        qrDataUrl={mobileAppQrDataUrl}
                      />
                    ) : null}
                  </div>
                </div>
              </footer>
            </div>
          </MobileAppChrome>
        </div>
      </div>
    </OrgProvider>
  )
}
