import type { Payload } from 'payload'

import { getConfiguredBaseUrl } from '@/lib/links'
import type { SiteSetting } from '@/payload-types'

export type PublicMobileAppRelease = {
  downloadPageUrl: string
  downloadUrl: string | null
  enabled: boolean
  latestTag: string | null
  latestVersion: string | null
  publishedAt: string | null
  releaseNotes: string | null
}

export type GithubMobileAppRelease = {
  downloadUrl: string
  latestTag: string
  latestVersion: string
  publishedAt: string
  releaseNotes: string | null
}

const DEFAULT_GITHUB_REPO = 'silvansan/ablaut-App'
const DEFAULT_APK_NAME = 'app-release.apk'

function normalizeReleaseVersion(value: string): string {
  const trimmed = value.trim()
  if (trimmed.startsWith('v') || trimmed.startsWith('V')) {
    return trimmed.slice(1)
  }
  return trimmed
}

function resolveApkAssetUrl(releaseJson: Record<string, unknown>): string | null {
  const assets = releaseJson.assets

  if (!Array.isArray(assets)) {
    return null
  }

  for (const asset of assets) {
    if (!asset || typeof asset !== 'object') {
      continue
    }

    const name = 'name' in asset ? String(asset.name) : ''
    if (name !== DEFAULT_APK_NAME) {
      continue
    }

    const browserUrl =
      'browser_download_url' in asset ? String(asset.browser_download_url ?? '').trim() : ''

    if (browserUrl) {
      return browserUrl
    }
  }

  return null
}

export async function fetchLatestGithubMobileAppRelease(
  githubRepo = process.env.MOBILE_APP_GITHUB_REPO?.trim() || DEFAULT_GITHUB_REPO,
): Promise<GithubMobileAppRelease | null> {
  const response = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ablaut-studio-mobile-app-sync',
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    return null
  }

  const releaseJson = (await response.json()) as Record<string, unknown>
  const tagName = typeof releaseJson.tag_name === 'string' ? releaseJson.tag_name.trim() : ''
  const latestVersion = normalizeReleaseVersion(tagName)
  const downloadUrl = resolveApkAssetUrl(releaseJson)

  if (!tagName || !latestVersion || !downloadUrl) {
    return null
  }

  const publishedAt =
    typeof releaseJson.published_at === 'string' && releaseJson.published_at
      ? releaseJson.published_at
      : new Date().toISOString()
  const releaseNotes =
    typeof releaseJson.body === 'string' && releaseJson.body.trim().length > 0
      ? releaseJson.body.trim()
      : null

  return {
    downloadUrl,
    latestTag: tagName,
    latestVersion,
    publishedAt,
    releaseNotes,
  }
}

function mobileAppFieldsFromSettings(settings: SiteSetting) {
  return {
    downloadUrl: settings.mobileAppDownloadUrl?.trim() || null,
    enabled: settings.mobileAppEnabled !== false,
    latestTag: settings.mobileAppLatestTag?.trim() || null,
    latestVersion: settings.mobileAppLatestVersion?.trim() || null,
    publishedAt: settings.mobileAppPublishedAt || null,
    releaseNotes: settings.mobileAppReleaseNotes?.trim() || null,
  }
}

export function getMobileAppDownloadPath(): string {
  return '/api/public/mobile-app/download'
}

export function getMobileAppDownloadPageUrl(baseUrl = getConfiguredBaseUrl()): string {
  return `${baseUrl.replace(/\/$/, '')}${getMobileAppDownloadPath()}`
}

export async function loadPublicMobileAppRelease(
  payload: Payload,
  baseUrl = getConfiguredBaseUrl(),
): Promise<PublicMobileAppRelease | null> {
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
  })
  const fields = mobileAppFieldsFromSettings(settings)

  if (!fields.enabled) {
    return null
  }

  const downloadPageUrl = getMobileAppDownloadPageUrl(baseUrl)

  if (!fields.latestVersion && !fields.downloadUrl) {
    return null
  }

  return {
    downloadPageUrl,
    downloadUrl: fields.downloadUrl,
    enabled: fields.enabled,
    latestTag: fields.latestTag,
    latestVersion: fields.latestVersion,
    publishedAt: fields.publishedAt,
    releaseNotes: fields.releaseNotes,
  }
}

export async function syncMobileAppRelease(
  payload: Payload,
  options?: {
    force?: boolean
    githubRepo?: string
  },
): Promise<PublicMobileAppRelease | null> {
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
  })
  const githubRepo =
    options?.githubRepo?.trim() ||
    settings.mobileAppGithubRepo?.trim() ||
    process.env.MOBILE_APP_GITHUB_REPO?.trim() ||
    DEFAULT_GITHUB_REPO
  const latest = await fetchLatestGithubMobileAppRelease(githubRepo)

  if (!latest) {
    payload.logger.warn(`Unable to sync mobile app release metadata from GitHub repo ${githubRepo}.`)
    return loadPublicMobileAppRelease(payload)
  }

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      mobileAppDownloadUrl: latest.downloadUrl,
      mobileAppEnabled: settings.mobileAppEnabled !== false,
      mobileAppGithubRepo: githubRepo,
      mobileAppLastSyncedAt: new Date().toISOString(),
      mobileAppLatestTag: latest.latestTag,
      mobileAppLatestVersion: latest.latestVersion,
      mobileAppPublishedAt: latest.publishedAt,
      mobileAppReleaseNotes: latest.releaseNotes,
    },
    overrideAccess: true,
  })

  payload.logger.info(
    `Synced mobile app release ${latest.latestTag} (${latest.latestVersion}) from ${githubRepo}.`,
  )

  return loadPublicMobileAppRelease(payload)
}

export async function syncMobileAppReleaseIfStale(payload: Payload): Promise<void> {
  if (process.env.MOBILE_APP_SYNC_ON_STARTUP === 'false') {
    return
  }

  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
  })
  const maxAgeMs = Number(process.env.MOBILE_APP_SYNC_MAX_AGE_MS ?? 6 * 60 * 60 * 1000)
  const lastSyncedAt = settings.mobileAppLastSyncedAt
    ? new Date(settings.mobileAppLastSyncedAt).getTime()
    : 0
  const isStale = !lastSyncedAt || Date.now() - lastSyncedAt >= maxAgeMs
  const missingMetadata = !settings.mobileAppLatestVersion || !settings.mobileAppDownloadUrl

  if (!isStale && !missingMetadata) {
    return
  }

  await syncMobileAppRelease(payload)
}
