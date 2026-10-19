import type { Event, User } from '@/payload-types'

export function userID(user: number | User): number {
  return typeof user === 'number' ? user : user.id
}

export function userLabel(user: number | User): string {
  return typeof user === 'number' ? `User ${user}` : user.name
}

export function eventTitle(event: number | Event): string {
  return typeof event === 'number' ? `Event ${event}` : event.title
}

export function getUserEventSummary(userId: number, userEvents: Map<number, string[]>): string {
  const events = userEvents.get(userId) ?? []

  if (events.length === 0) {
    return 'No assigned events'
  }

  if (events.length <= 2) {
    return events.join(', ')
  }

  return `${events.slice(0, 2).join(', ')} ... (${events.length} total)`
}

export function formatOrganizationRole(role: string | null | undefined): string {
  if (!role) {
    return 'Member'
  }

  return role.replace(/_/g, ' ')
}

/** Platform admins and super admins manage every organization, so their organization role means nothing. */
export function hasPlatformRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin'
}

export function formatGlobalRole(role: string | null | undefined): string {
  if (!role) {
    return 'Moderator'
  }

  return role.replace(/_/g, ' ')
}
