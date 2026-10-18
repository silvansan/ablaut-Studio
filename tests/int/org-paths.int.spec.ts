import { describe, expect, it } from 'vitest'

import { generateOrgKey, isOrgKey } from '@/lib/org-key'
import { isOrgScopedInternalPath, parseAdminPath, publicSubpath, toPublicPath } from '@/lib/org-paths'

const key = 'ka3dhay4'

describe('organization key', () => {
  it('is 8 lowercase alphanumerics and unique enough', () => {
    const keys = new Set(Array.from({ length: 200 }, () => generateOrgKey()))

    expect(keys.size).toBe(200)
    for (const generated of keys) {
      expect(isOrgKey(generated)).toBe(true)
    }
  })

  it('rejects anything else', () => {
    expect(isOrgKey('short')).toBe(false)
    expect(isOrgKey('UPPERCASE')).toBe(false)
    expect(isOrgKey('has-dash1')).toBe(false)
    expect(isOrgKey(undefined)).toBe(false)
  })
})

describe('parseAdminPath', () => {
  it('maps organization URLs onto the internal page routes', () => {
    expect(parseAdminPath(`/o/${key}`)).toEqual({ internalPath: '/events', kind: 'org', orgKey: key })
    expect(parseAdminPath(`/o/${key}/events/sunday/share`)).toEqual({
      internalPath: '/events/sunday/share',
      kind: 'org',
      orgKey: key,
    })
    expect(parseAdminPath(`/o/${key}/people/7`)).toEqual({ internalPath: '/users/7', kind: 'org', orgKey: key })
    expect(parseAdminPath(`/o/${key}/settings`)?.internalPath).toBe('/settings')
  })

  it('maps platform URLs without an organization', () => {
    expect(parseAdminPath('/platform/organizations/acme')).toEqual({
      internalPath: '/organizations/acme',
      kind: 'platform',
    })
    expect(parseAdminPath('/platform/users')?.internalPath).toBe('/users')
    expect(parseAdminPath('/platform/server')?.internalPath).toBe('/server')
  })

  it('ignores everything else, including public listener URLs', () => {
    expect(parseAdminPath('/events')).toBeNull()
    expect(parseAdminPath('/listen/event/channel')).toBeNull()
    expect(parseAdminPath('/o/notakey/events')).toBeNull()
    expect(parseAdminPath(`/o/${key}/unknown`)).toBeNull()
    expect(parseAdminPath('/platform/unknown')).toBeNull()
  })
})

describe('toPublicPath', () => {
  it('prefixes organization pages and renames users to people', () => {
    expect(toPublicPath('/events', key)).toBe(`/o/${key}/events`)
    expect(toPublicPath('/events/x/channels/y?tab=1#top', key)).toBe(`/o/${key}/events/x/channels/y?tab=1#top`)
    expect(toPublicPath('/users', key)).toBe(`/o/${key}/people`)
    expect(toPublicPath('/users/5', key)).toBe(`/o/${key}/people/5`)
    expect(toPublicPath('/settings', key)).toBe(`/o/${key}/settings`)
  })

  it('moves organization management under /platform with or without an organization', () => {
    expect(toPublicPath('/organizations', key)).toBe('/platform/organizations')
    expect(toPublicPath('/organizations/acme', null)).toBe('/platform/organizations/acme')
  })

  it('leaves links alone when there is no organization or they are not admin pages', () => {
    expect(toPublicPath('/events/x', null)).toBe('/events/x')
    expect(toPublicPath('/profile', key)).toBe('/profile')
    expect(toPublicPath('/listen/e/c', key)).toBe('/listen/e/c')
    expect(toPublicPath('/api/users/login', key)).toBe('/api/users/login')
    expect(toPublicPath('https://example.org/events', key)).toBe('https://example.org/events')
    expect(toPublicPath('//evil.example/events', key)).toBe('//evil.example/events')
  })

  it('is the inverse of parseAdminPath for organization pages', () => {
    for (const internal of ['/events', '/events/a/share', '/users', '/users/3', '/settings']) {
      const parsed = parseAdminPath(toPublicPath(internal, key))

      expect(parsed?.internalPath).toBe(internal)
    }
  })
})

describe('helpers', () => {
  it('knows which internal routes need an organization', () => {
    expect(isOrgScopedInternalPath('/events/x')).toBe(true)
    expect(isOrgScopedInternalPath('/users')).toBe(true)
    expect(isOrgScopedInternalPath('/profile')).toBe(false)
    expect(isOrgScopedInternalPath('/organizations')).toBe(false)
  })

  it('strips the organization prefix for navigation matching', () => {
    expect(publicSubpath(`/o/${key}/events/x`)).toBe('/events/x')
    expect(publicSubpath(`/o/${key}`)).toBe('/events')
    expect(publicSubpath('/platform/organizations')).toBe('/organizations')
    expect(publicSubpath('/profile')).toBe('/profile')
  })
})
