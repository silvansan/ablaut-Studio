import type { Access } from 'payload'

import { canCreateEvents } from '@/lib/permissions'

export const canCreateEvent: Access = async ({ req }) => {
  return canCreateEvents(req)
}
