import type { AblautFeature } from '@/features/types'
import { isFeatureEnabled } from '@/features/types'

export const organizationsFeature: AblautFeature = {
  enabled: () => isFeatureEnabled('organizations'),
  id: 'organizations',
  label: 'Organizations',
  navItems: ({ isAdmin, isOrganizationManager, isSuperAdmin, pendingJoinRequestCount, showMultiOrganizationNav }) => {
    if (!isAdmin && !isOrganizationManager) {
      return []
    }

    if (!showMultiOrganizationNav && !isSuperAdmin && !isOrganizationManager) {
      return []
    }

    return [
      {
        badge: pendingJoinRequestCount > 0 ? pendingJoinRequestCount : undefined,
        children: showMultiOrganizationNav ? [{ href: '/users', label: 'Users' }] : [{ href: '/users', label: 'Users' }],
        featureId: 'organizations',
        href: '/organizations',
        label: 'Organizations',
      },
    ]
  },
}
