import { NextResponse } from 'next/server'

import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { getConfiguredBaseUrl, getRequestBaseUrlFromRequest } from '@/lib/links'
import { loadPublicMobileAppRelease } from '@/lib/mobile-app-release'

export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const release = await loadPublicMobileAppRelease(
    payload,
    getRequestBaseUrlFromRequest(request) ?? getConfiguredBaseUrl(),
  )

  if (!release) {
    return NextResponse.json({ error: 'Android app download is disabled.' }, { status: 404 })
  }

  return NextResponse.json({
    downloadPageUrl: release.downloadPageUrl,
    downloadUrl: release.downloadUrl,
    latestTag: release.latestTag,
    latestVersion: release.latestVersion,
    publishedAt: release.publishedAt,
    releaseNotes: release.releaseNotes,
  })
}
