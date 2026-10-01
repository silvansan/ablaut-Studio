'use server'

import { revalidatePath } from 'next/cache'
import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import { importAblautConfig } from '@/lib/config-transfer'
import { isSuperAdminUser } from '@/lib/permissions'

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function numberValue(formData: FormData, key: string): number | undefined {
  const value = stringValue(formData, key)
  const parsed = value ? Number(value) : undefined

  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : undefined
}

function checkedValue(formData: FormData, key: string): boolean {
  return formData.get(key) === 'on'
}

function qrStyleValue(formData: FormData) {
  const value = stringValue(formData, 'defaultQrStyle')

  if (value === 'high-contrast') {
    return value
  }

  return 'ablaut-default'
}

export async function updateSiteSettingsAction(formData: FormData) {
  const user = await requireAppUser()

  if (!isSuperAdminUser(user)) {
    throw new Error('Only super admins can update site settings.')
  }

  const payload = await getPayload({ config: configPromise })

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      allowPublicListenerPages: checkedValue(formData, 'allowPublicListenerPages'),
      defaultQrStyle: qrStyleValue(formData),
      defaultTokenExpiry: numberValue(formData, 'defaultTokenExpiry') ?? 3600,
      livekitPublicUrl: stringValue(formData, 'livekitPublicUrl'),
      publicBaseUrl: stringValue(formData, 'publicBaseUrl'),
      requireEmailVerification: checkedValue(formData, 'requireEmailVerification'),
      siteName: stringValue(formData, 'siteName') ?? 'ablaut',
      supportEmail: stringValue(formData, 'supportEmail'),
    },
    overrideAccess: true,
  })

  revalidatePath('/settings')
}

export async function importConfigAction(formData: FormData) {
  const user = await requireAppUser()
  const scope = stringValue(formData, 'scope')
  const file = formData.get('configFile')

  if (!(file instanceof File)) {
    throw new Error('Choose a config JSON file to import.')
  }

  const json = JSON.parse(await file.text()) as unknown

  await importAblautConfig(user, json, scope)

  revalidatePath('/events')
  revalidatePath('/users')
  revalidatePath('/settings')
}
