import type { ReactNode } from 'react'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'

import { GitHubIcon, LicenseIcon, UserCircleIcon } from './ActionIcons'
import { AppDownloadFooterLink } from './AppDownloadFooterLink'
import { AppNav } from './AppNav'
import { Logo } from './Logo'
import { getCurrentAppUser, requireAppUser } from '@/lib/app-auth'
import { APP_PRONUNCIATION, APP_PRODUCT_NAME, APP_STUDIO_NAME } from '@/lib/branding'
import { getFeatureNavItems } from '@/features/registry'
import { getRequestBaseUrl } from '@/lib/links'
import { loadPublicMobileAppRelease } from '@/lib/mobile-app-release'
import { countActiveOrganizationsForUser, countPendingJoinRequestsForUser, hasOrganizationManagementAccess, shouldShowMultiOrganizationNav } from '@/lib/organizations'
import { generateQrDataUrl } from '@/lib/qrcode'
import { isAdminUser, isSuperAdminUser } from '@/lib/permissions'

type LayoutProps = {
  children: ReactNode
  hideBetaBanner?: boolean
  hideHeader?: boolean
  requireAuth?: boolean
  title?: string
}

type NavItem = {
  badge?: number
  children?: Array<{ href: string; label: string }>
  href: string
  label: string
  show: boolean
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
  const mobileRelease = await loadPublicMobileAppRelease(payload, await getRequestBaseUrl())
  const mobileAppQrDataUrl =
    mobileRelease?.latestVersion && mobileRelease.downloadPageUrl
      ? await generateQrDataUrl(mobileRelease.downloadPageUrl)
      : null
  const showAppMenu = Boolean(user)
  const showPayloadAdmin = user ? isSuperAdminUser(user) : false
  const activeOrganizationCount =
    user && showAppMenu
      ? await countActiveOrganizationsForUser(payload, user.id)
      : 0
  const showMultiOrganizationNav = shouldShowMultiOrganizationNav(user, activeOrganizationCount)
  const isOrganizationManager = user
    ? await hasOrganizationManagementAccess({ payload, user } as never)
    : false
  const pendingJoinRequestCount =
    user && isOrganizationManager ? await countPendingJoinRequestsForUser(payload, user) : 0
  const currentYear = new Date().getFullYear()
  const navItems: NavItem[] = [
    ...getFeatureNavItems({
      isAdmin: Boolean(user && isAdminUser(user)),
      isOrganizationManager,
      isSuperAdmin: showPayloadAdmin,
      pendingJoinRequestCount,
      showMultiOrganizationNav,
    }).map((item) => ({ ...item, show: true })),
    { href: '/admin', label: 'Payload Admin', show: showPayloadAdmin },
  ].filter((item) => item.show)

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-4 xl:flex-row">
        {showAppMenu ? (
          <aside className="us-panel overflow-visible xl:w-[290px] xl:flex-none">
            <div
              className="us-hero-glow relative flex h-full flex-col gap-5 px-5 py-5 xl:gap-8 xl:py-6"
              style={{
                background:
                  'linear-gradient(180deg, rgba(22, 63, 53, 0.98) 0%, rgba(18, 107, 182, 0.94) 100%)',
              }}
            >
              <div className="relative z-10">
                <Logo theme="light" />
              </div>

              <AppNav items={navItems} />

              <Link
                href="/profile"
                className="relative z-0 mt-auto flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-semibold"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderColor: 'rgba(255,255,255,0.24)',
                  color: 'rgba(255,255,255,0.96)',
                  textShadow: '0 1px 2px rgba(0,0,0,0.18)',
                }}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white">
                  <UserCircleIcon />
                </span>
                <span className="min-w-0">
                  <span className="block">My profile</span>
                  <span className="block truncate text-xs font-normal" style={{ color: 'rgba(255,255,255,0.74)' }}>
                    {user?.email}
                  </span>
                </span>
              </Link>

            </div>
          </aside>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {hideHeader ? null : (
            <header className="us-panel px-5 py-4 md:px-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-tight" style={{ color: 'var(--us-blue-dark)' }}>
                    {APP_STUDIO_NAME}
                  </p>
                  {title ? (
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                      {title}
                    </h1>
                  ) : (
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
                      Event audio control
                    </h1>
                  )}
                </div>
              </div>
            </header>
          )}

          <main className="min-w-0 flex-1">
            {user && !hideBetaBanner ? (
              <div
                className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border px-4 py-3 text-sm"
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

          <footer className="us-panel px-5 py-4 text-xs md:px-6" style={{ color: 'var(--us-muted)' }}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p>
                Copyright © {currentYear} {APP_STUDIO_NAME} · {APP_PRODUCT_NAME} {APP_PRONUNCIATION}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                <Link className="inline-flex items-center gap-1.5 font-medium" href="/feedback" style={{ color: 'var(--us-blue-dark)' }}>
                  Beta feedback
                </Link>
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
      </div>
    </div>
  )
}
