export function resolveBrandedQrOrganizationTitle(value?: string | null): string {
  const trimmed = value?.trim()
  return trimmed || 'ablaut'
}

export function resolveBrandedQrChannelTitle(value?: string | null, fallback = 'Channel'): string {
  const trimmed = value?.trim()
  return trimmed || fallback
}
