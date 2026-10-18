'use server'

import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'

import { requireAppUser } from '@/lib/app-auth'
import { redirectInOrg } from '@/lib/org-redirect'

function stringValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)

  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

export async function updateProfileAction(formData: FormData) {
  const user = await requireAppUser()
  const name = stringValue(formData, 'name')
  const preferredLanguage = stringValue(formData, 'preferredLanguage') ?? 'en'

  if (!name) {
    throw new Error('Name is required.')
  }

  const payload = await getPayload({ config: configPromise })

  await payload.update({
    id: user.id,
    collection: 'users',
    data: {
      name,
      preferredLanguage,
    },
    overrideAccess: true,
    user,
  })

  revalidatePath('/profile')
}

export async function changeOwnPasswordAction(formData: FormData) {
  const user = await requireAppUser()
  const currentPassword = stringValue(formData, 'currentPassword')
  const newPassword = stringValue(formData, 'newPassword')
  const confirmPassword = stringValue(formData, 'confirmPassword')

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error('Current password, new password, and confirmation are required.')
  }

  if (newPassword.length < 8) {
    throw new Error('Use at least 8 characters for the new password.')
  }

  if (newPassword !== confirmPassword) {
    throw new Error('The password confirmation does not match.')
  }

  const payload = await getPayload({ config: configPromise })

  try {
    await payload.login({
      collection: 'users',
      data: {
        email: user.email,
        password: currentPassword,
      },
      overrideAccess: true,
    })
  } catch {
    throw new Error('The current password did not work.')
  }

  await payload.update({
    id: user.id,
    collection: 'users',
    data: {
      password: newPassword,
    },
    overrideAccess: true,
    user,
  })

  revalidatePath('/profile')
}

export async function logoutAction() {
  const cookieStore = await cookies()

  cookieStore.delete('payload-token')
  await redirectInOrg('/')
}
