import { NextResponse, type NextRequest } from 'next/server'

import { ORG_COOKIE, ORG_KEY_HEADER, SCOPE_HEADER, URL_HEADER } from '@/lib/org-headers'
import { parseAdminPath } from '@/lib/org-paths'

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(self)',
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const requestHeaders = new Headers(request.headers)

  // Never trust these from the client: only this middleware may set them.
  requestHeaders.delete(ORG_KEY_HEADER)
  requestHeaders.delete(SCOPE_HEADER)
  requestHeaders.set(URL_HEADER, `${pathname}${search}`)

  const parsed = parseAdminPath(pathname)
  let response: NextResponse

  if (parsed) {
    const target = request.nextUrl.clone()
    target.pathname = parsed.internalPath
    requestHeaders.set(SCOPE_HEADER, parsed.kind)

    if (parsed.kind === 'org') {
      requestHeaders.set(ORG_KEY_HEADER, parsed.orgKey)
    }

    response = NextResponse.rewrite(target, { request: { headers: requestHeaders } })

    if (parsed.kind === 'org') {
      // Remember the last organization so old URLs and fresh logins land in the same place.
      response.cookies.set(ORG_COOKIE, parsed.orgKey, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        sameSite: 'lax',
        secure: process.env.PUBLIC_BASE_URL?.startsWith('https://') ?? false,
      })
    }
  } else {
    response = NextResponse.next({ request: { headers: requestHeaders } })
  }

  for (const [header, value] of Object.entries(securityHeaders)) {
    response.headers.set(header, value)
  }

  if (request.nextUrl.protocol === 'https:' || process.env.PUBLIC_BASE_URL?.startsWith('https://')) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png).*)'],
}
