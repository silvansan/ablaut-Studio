import type { AblautFeature } from '@/features/types'
import { isFeatureEnabled } from '@/features/types'

export const coreFeature: AblautFeature = {
  enabled: () => isFeatureEnabled('core'),
  id: 'core',
  label: 'Core',
  navItems: ({ isAdmin, isOrganizationManager }) => {
    const items = [{ featureId: 'core', href: '/events', label: 'Events' }]

    if (isAdmin || isOrganizationManager) {
      items.push({ featureId: 'core', href: '/users', label: 'Users' })
    }

    return items
  },
}
