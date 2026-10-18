'use client'

import NextLink from 'next/link'
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'

import { toPublicPath } from '@/lib/org-paths'

const OrgKeyContext = createContext<null | string>(null)

/** Provides the key of the organization the visitor is currently inside, for link building. */
export function OrgProvider({ children, orgKey }: { children: ReactNode; orgKey: null | string }) {
  return <OrgKeyContext.Provider value={orgKey}>{children}</OrgKeyContext.Provider>
}

export function useOrgKey(): null | string {
  return useContext(OrgKeyContext)
}

/**
 * Drop-in replacement for `next/link`. Pages keep writing `/events/x` or `/users`; this turns
 * them into `/o/<key>/events/x` or `/o/<key>/people` for the current organization.
 */
export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const orgKey = useOrgKey()
  const resolved = typeof href === 'string' ? toPublicPath(href, orgKey) : href

  return <NextLink href={resolved} {...props} />
}
