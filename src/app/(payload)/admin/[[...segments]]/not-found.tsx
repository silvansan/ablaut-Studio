/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { importMap } from '../importMap'
import { getCurrentAppUser } from '@/lib/app-auth'
import { isSuperAdminUser } from '@/lib/permissions'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

function getSafeReturnPath(referer: string | null): string {
  if (!referer) {
    return '/events'
  }

  try {
    const url = new URL(referer)

    if (url.pathname.startsWith('/admin')) {
      return '/events'
    }

    return `${url.pathname}${url.search}`
  } catch {
    return '/events'
  }
}

const NotFound = async ({ params, searchParams }: Args) => {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect('/')
  }

  if (!isSuperAdminUser(user)) {
    const requestHeaders = await headers()

    redirect(getSafeReturnPath(requestHeaders.get('referer')))
  }

  return NotFoundPage({ config, params, searchParams, importMap })
}

export default NotFound
