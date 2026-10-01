/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import React from 'react'

import { getCurrentAppUser } from '@/lib/app-auth'
import { isSuperAdminUser } from '@/lib/permissions'
import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

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

const Layout = async ({ children }: Args) => {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect('/')
  }

  if (!isSuperAdminUser(user)) {
    const requestHeaders = await headers()

    redirect(getSafeReturnPath(requestHeaders.get('referer')))
  }

  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}

export default Layout
