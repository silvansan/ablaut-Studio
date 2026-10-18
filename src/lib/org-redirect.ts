import { redirect } from 'next/navigation'

import { getRequestScope } from '@/lib/org-context'
import { toPublicPath } from '@/lib/org-paths'

/**
 * `redirect()` for server actions. Sends people to the organization-scoped URL they are used to
 * (`/o/<key>/events/x`) instead of the internal one, which would leave the address bar and the
 * sidebar highlight on the wrong URL. Paths that are already public pass through unchanged.
 */
export async function redirectInOrg(path: string): Promise<never> {
  const scope = await getRequestScope()

  redirect(toPublicPath(path, scope.kind === 'org' ? scope.orgKey : null))
}
