export const EVENT_PERMISSIONS = [
  { defaultOn: false, key: 'canEditEvent', label: 'Edit event' },
  { defaultOn: true, key: 'canCreateChannels', label: 'Add channels' },
  { defaultOn: true, key: 'canDeleteChannels', label: 'Delete channels' },
  { defaultOn: true, key: 'canViewQR', label: 'View QR codes' },
  { defaultOn: true, key: 'canManageSpeakerPassword', label: 'Speaker password' },
] as const

export type EventPermissionKey = (typeof EVENT_PERMISSIONS)[number]['key']
export type EventPermissions = Record<EventPermissionKey, boolean>

export const EVENT_ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Moderator', value: 'moderator' },
  { label: 'Viewer', value: 'viewer' },
] as const

export type EventRole = (typeof EVENT_ROLES)[number]['value']
