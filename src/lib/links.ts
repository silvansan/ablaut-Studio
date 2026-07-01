import { headers } from 'next/headers'

function configuredBaseUrl() {
  return process.env.PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export function getConfiguredBaseUrl(): string {
  return configuredBaseUrl()
}

function isLocalNetworkHost(host: string): boolean {
  const hostname = host.split(':')[0] ?? host

  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  )
}

function resolveProtocolForHost(host: string, forwardedProto?: string | null): string {
  if (forwardedProto) {
    return forwardedProto
  }

  return isLocalNetworkHost(host) ? 'http' : 'https'
}

export function getRequestBaseUrlFromRequest(request: Request): string | null {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host')

  if (!host) {
    return null
  }

  return `${resolveProtocolForHost(host, request.headers.get('x-forwarded-proto'))}://${host}`
}

export async function getRequestBaseUrl(): Promise<string> {
  const requestHeaders = await headers()
  const host = requestHeaders.get('x-forwarded-host') || requestHeaders.get('host')

  if (!host) {
    return configuredBaseUrl()
  }

  const protocol = resolveProtocolForHost(host, requestHeaders.get('x-forwarded-proto'))

  return `${protocol}://${host}`
}

export function getListenerUrl(eventSlug: string, channelSlug: string, baseUrl = configuredBaseUrl()): string {
  return `${baseUrl}/listen/${eventSlug}/${channelSlug}`
}

export function getEventListenerUrl(eventSlug: string, baseUrl = configuredBaseUrl()): string {
  return `${baseUrl}/listen/${eventSlug}`
}

export function getSpeakerUrl(eventSlug: string, channelSlug: string, baseUrl = configuredBaseUrl()): string {
  return `${baseUrl}/speak/${eventSlug}/${channelSlug}`
}

export function getEventUrl(eventSlug: string, baseUrl = configuredBaseUrl()): string {
  return `${baseUrl}/events/${eventSlug}`
}
