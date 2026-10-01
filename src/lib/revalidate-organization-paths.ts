import { revalidatePath } from 'next/cache'

export function revalidateOrganizationPaths(orgSlug?: string | null) {
  revalidatePath('/organizations')
  revalidatePath('/users')
  revalidatePath('/events')
  revalidatePath('/profile')
  revalidatePath('/settings')

  if (orgSlug) {
    revalidatePath(`/organizations/${orgSlug}`)
  }
}
