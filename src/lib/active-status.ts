export type StatusChip = {
  className: string
  label: string
}

export function eventStatusChip(status?: string | null): StatusChip {
  if (status === 'active') {
    return { className: 'us-chip-active', label: 'Active' }
  }

  if (status === 'archived') {
    return { className: 'us-chip-muted', label: 'Archived' }
  }

  return { className: 'us-chip-inactive', label: 'Inactive' }
}

export function channelEnabledChip(enabled?: boolean | null): StatusChip {
  if (enabled === false) {
    return { className: 'us-chip-inactive', label: 'Inactive' }
  }

  return { className: 'us-chip-active', label: 'Active' }
}
