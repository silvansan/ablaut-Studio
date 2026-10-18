import { ORG_KEY_PATTERN } from '@/lib/org-key'

/**
 * URL model for the admin app. Pages keep living at their original folders (`/events`,
 * `/users`, `/settings`, `/organizations`); middleware maps the public, organization-scoped
 * URLs onto them, and links are written back to the public form.
 *
 *   /o/<key>/events/...        ->  /events/...
 *   /o/<key>/people/...        ->  /users/...
 *   /o/<key>/settings          ->  /settings
 *   /platform/organizations... ->  /organizations...
 *   /platform/users...         ->  /users...      (all organizations)
 *   /platform/settings         ->  /settings      (site-wide)
 *   /platform/server           ->  /server
 *
 * Public listener and speaker URLs (/listen, /speak) are not part of this model.
 *
 * This module is pure so it can run in middleware (edge) and in client components.
 */

export type ParsedAdminPath =
  | { internalPath: string; kind: 'org'; orgKey: string }
  | { internalPath: string; kind: 'platform' }

const ORG_ROOTS: Record<string, string> = {
  events: 'events',
  people: 'users',
  settings: 'settings',
}

const PLATFORM_ROOTS: Record<string, string> = {
  organizations: 'organizations',
  server: 'server',
  settings: 'settings',
  users: 'users',
}

const INTERNAL_TO_ORG: Record<string, string> = {
  events: 'events',
  settings: 'settings',
  users: 'people',
}

/** Internal roots that always live under /platform, with or without an organization. */
const INTERNAL_TO_PLATFORM: Record<string, string> = {
  organizations: 'organizations',
  server: 'server',
}

function splitPath(pathname: string) {
  const [segment = '', ...rest] = pathname.replace(/^\/+/, '').split('/')
  return { rest: rest.length > 0 ? `/${rest.join('/')}` : '', segment }
}

function splitSuffix(href: string) {
  const index = href.search(/[?#]/)
  return index === -1 ? { path: href, suffix: '' } : { path: href.slice(0, index), suffix: href.slice(index) }
}

/** Maps a public admin URL path to the internal page route, or null when it is not an admin URL. */
export function parseAdminPath(pathname: string): ParsedAdminPath | null {
  const first = splitPath(pathname)

  if (first.segment === 'o') {
    const afterO = splitPath(first.rest)

    if (!ORG_KEY_PATTERN.test(afterO.segment)) {
      return null
    }

    const section = splitPath(afterO.rest)

    if (!section.segment) {
      return { internalPath: '/events', kind: 'org', orgKey: afterO.segment }
    }

    const internalRoot = ORG_ROOTS[section.segment]

    return internalRoot
      ? { internalPath: `/${internalRoot}${section.rest}`, kind: 'org', orgKey: afterO.segment }
      : null
  }

  if (first.segment === 'platform') {
    const section = splitPath(first.rest)
    const internalRoot = PLATFORM_ROOTS[section.segment]

    return internalRoot ? { internalPath: `/${internalRoot}${section.rest}`, kind: 'platform' } : null
  }

  return null
}

/**
 * Rewrites an internal href (`/events/x`) to its public form. `orgKey` is the organization the
 * visitor is currently inside, if any. Anything that is not an admin URL passes through.
 */
export function toPublicPath(href: string, orgKey: null | string | undefined): string {
  if (!href.startsWith('/') || href.startsWith('//')) {
    return href
  }

  const { path, suffix } = splitSuffix(href)
  const { rest, segment } = splitPath(path)

  const platformRoot = INTERNAL_TO_PLATFORM[segment]

  if (platformRoot) {
    return `/platform/${platformRoot}${rest}${suffix}`
  }

  const orgRoot = INTERNAL_TO_ORG[segment]

  if (orgRoot && orgKey) {
    return `/o/${orgKey}/${orgRoot}${rest}${suffix}`
  }

  return href
}

/** True for internal routes that only make sense inside an organization (used to canonicalize old URLs). */
export function isOrgScopedInternalPath(pathname: string): boolean {
  const { segment } = splitPath(pathname)
  return segment in INTERNAL_TO_ORG
}

/** Strips `/o/<key>` so navigation can compare against section names ("events", "people", ...). */
export function publicSubpath(pathname: string): string {
  const parsed = parseAdminPath(pathname)

  if (!parsed) {
    return pathname
  }

  const first = splitPath(pathname)

  if (first.segment === 'o') {
    const afterO = splitPath(first.rest)
    return afterO.rest || '/events'
  }

  return first.rest
}
