/**
 * The organization key is the opaque segment in admin URLs (`/o/<key>/events/...`). It is
 * random on purpose: unlike the slug it does not reveal the organization's name, and it never
 * changes when the organization is renamed.
 */
export const ORG_KEY_LENGTH = 8
export const ORG_KEY_PATTERN = /^[a-z0-9]{8}$/

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'

export function generateOrgKey(): string {
  // Web Crypto, not node:crypto: this module is also bundled for middleware and the browser.
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(ORG_KEY_LENGTH))
  let key = ''

  for (const byte of bytes) {
    key += ALPHABET[byte % ALPHABET.length]
  }

  return key
}

export function isOrgKey(value: unknown): value is string {
  return typeof value === 'string' && ORG_KEY_PATTERN.test(value)
}
