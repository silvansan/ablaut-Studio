import { LockIcon, PencilIcon, PlusIcon, QRCodeIcon, TrashIcon } from '@/components/ActionIcons'
import type { EventPermissionKey } from '@/lib/event-permissions'

export function EventPermissionIcon({ permission }: { permission: EventPermissionKey }) {
  switch (permission) {
    case 'canEditEvent':
      return <PencilIcon />
    case 'canCreateChannels':
      return <PlusIcon />
    case 'canDeleteChannels':
      return <TrashIcon />
    case 'canViewQR':
      return <QRCodeIcon />
    default:
      return <LockIcon />
  }
}
