import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { isSuperAdminUser } from '@/lib/permissions'
import { collectServerStats } from '@/lib/server-stats'

export const dynamic = 'force-dynamic'

/** Live server numbers for the Server health page. Super admins only. */
export async function GET(request: Request) {
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: request.headers })

  if (!isSuperAdminUser(user)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(await collectServerStats(payload), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
