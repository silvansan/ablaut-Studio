import configPromise from '@payload-config'
import { getPayload } from 'payload'

import type { BrandedQrStyle } from '@/lib/branded-qrcode'

export async function getDefaultQrStyle(): Promise<BrandedQrStyle> {
  const payload = await getPayload({ config: configPromise })
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    overrideAccess: true,
  })

  return settings.defaultQrStyle === 'high-contrast' ? 'high-contrast' : 'ablaut-default'
}
