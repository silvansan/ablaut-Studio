import { describe, expect, it } from 'vitest'

import {
  generateBrandedDownloadQrDataUrl,
  generateBrandedQrCardDataUrl,
  generateBrandedRouteQrDataUrl,
} from '@/lib/branded-qrcode'

describe('branded QR cards', () => {
  it('builds a listener route card with org and channel titles', async () => {
    const dataUrl = await generateBrandedRouteQrDataUrl({
      channelName: 'English',
      organizationName: 'Demo Org',
      url: 'https://studio.example.com/listen/demo/en',
      variant: 'listener',
    })

    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
    expect(dataUrl.length).toBeGreaterThan(10_000)
  })

  it('builds a speaker route card', async () => {
    const dataUrl = await generateBrandedRouteQrDataUrl({
      channelName: 'English',
      organizationName: 'Demo Org',
      url: 'https://studio.example.com/speak/demo/en',
      variant: 'speaker',
    })

    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('builds an Android download card with custom footer label', async () => {
    const dataUrl = await generateBrandedDownloadQrDataUrl({
      url: 'https://studio.example.com/api/public/mobile-app/download',
      version: '0.3.2',
    })

    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
  })

  it('falls back to ablaut when titles are empty', async () => {
    const dataUrl = await generateBrandedQrCardDataUrl({
      kind: 'listener',
      primaryTitle: '   ',
      secondaryTitle: '',
      url: 'https://studio.example.com/listen/demo/en',
    })

    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true)
  })
})
