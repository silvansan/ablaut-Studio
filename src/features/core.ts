import type { AblautFeature } from '@/features/types'
import { isFeatureEnabled } from '@/features/types'

export const coreFeature: AblautFeature = {
  enabled: () => isFeatureEnabled('core'),
  id: 'core',
  label: 'Core',
  navItems: ({ isOrganizationManager, showMultiOrganizationNav }) => [
    { featureId: 'core', href: '/dashboard', label: 'Dashboard' },
    {
      children:
        showMultiOrganizationNav || isOrganizationManager ? [{ href: '/channels', label: 'Channels' }] : undefined,
      featureId: 'core',
      href: '/events',
      label: 'Events',
    },
    { featureId: 'core', href: '/settings', label: 'Settings' },
  ],
}
