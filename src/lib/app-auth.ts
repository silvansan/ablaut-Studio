import configPromise from '@payload-config'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { getPayload } from 'payload'

import type { User } from '@/payload-types'

// Cached per request: layouts, data helpers and the org context all ask who is signed in.
export const getCurrentAppUser = cache(async (): Promise<User | null> => {
  const payload = await getPayload({ config: configPromise })
  const requestHeaders = await headers()
  const authHeaders = new Headers(requestHeaders)
  const cookieStore = await cookies()
  const payloadToken = cookieStore.get('payload-token')?.value

  if (payloadToken && !authHeaders.has('authorization')) {
    authHeaders.set('authorization', `JWT ${payloadToken}`)
  }

  const { user } = await payload.auth({ headers: authHeaders })

  return (user as User | null) ?? null
})

export async function requireAppUser(): Promise<User> {
  const user = await getCurrentAppUser()

  if (!user) {
    redirect('/')
  }

  return user
}
