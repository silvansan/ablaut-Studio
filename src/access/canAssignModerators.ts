import type { Access } from 'payload'

import { canUserManageEventByID, isSuperAdminUser } from '@/lib/permissions'

export const canAssignModerators: Access = async ({ data, req }) => {
  if (isSuperAdminUser(req.user)) {
    return true
  }

  return canUserManageEventByID(req, data?.event)
}
