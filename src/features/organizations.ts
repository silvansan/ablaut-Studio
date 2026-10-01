import type { AblautFeature } from '@/features/types'
import { isFeatureEnabled } from '@/features/types'

export const organizationsFeature: AblautFeature = {
  enabled: () => isFeatureEnabled('organizations'),
  id: 'organizations',
  label: 'Organizations',
  navItems: ({ pendingJoinRequestCount, showMultiOrganizationNav }) => {
    if (!showMultiOrganizationNav) {
      return []
    }

    return [
      {
        badge: pendingJoinRequestCount > 0 ? pendingJoinRequestCount : undefined,
        featureId: 'organizations',
        href: '/organizations',
        label: 'Organizations',
      },
    ]
  },
}
