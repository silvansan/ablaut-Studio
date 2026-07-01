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

  if (!release?.downloadUrl) {
    return NextResponse.json({ error: 'Android app release is not available yet.' }, { status: 404 })
  }

  return NextResponse.redirect(release.downloadUrl, 302)
}
