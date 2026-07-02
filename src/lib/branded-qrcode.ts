import fs from 'node:fs'
import path from 'node:path'

import QRCode from 'qrcode'
import sharp from 'sharp'

export const ABLAUT_QR_COLORS = {
  greenDark: '#163f35',
  green: '#2f8f63',
  blue: '#26a7f2',
  blueDark: '#126bb6',
  muted: '#5d7680',
  card: '#fcfffd',
  white: '#ffffff',
} as const

export type BrandedQrKind = 'listener' | 'speaker' | 'download'

export type BrandedQrCardInput = {
  footerLabel?: string
  kind: BrandedQrKind
  primaryTitle: string
  secondaryTitle: string
  url: string
}

const CARD_WIDTH = 720
const CARD_HEIGHT = 900
const QR_SIZE = 420

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function truncateTitle(value: string, maxLength: number): string {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'ablaut'
  }

  if (trimmed.length <= maxLength) {
    return trimmed
  }

  return `${trimmed.slice(0, maxLength - 1)}…`
}

function defaultFooterLabel(kind: BrandedQrKind): string {
  if (kind === 'speaker') {
    return 'speak'
  }

  if (kind === 'listener') {
    return 'listen'
  }

  return 'android ablaut-app download'
}

async function createFallbackLogo(size: number): Promise<Buffer> {
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${ABLAUT_QR_COLORS.green}"/>
        <stop offset="100%" stop-color="${ABLAUT_QR_COLORS.blueDark}"/>
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#logoGradient)"/>
    <path d="M22 40V24h8c4.4 0 8 2.7 8 8s-3.6 8-8 8h-2v-4h2c2.2 0 4-1.3 4-4s-1.8-4-4-4h-4v16h-4z" fill="white"/>
  </svg>`

  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function loadLogoBuffer(size: number): Promise<Buffer> {
  const iconPath = path.join(process.cwd(), 'public', 'ablaut-icon.png')

  if (fs.existsSync(iconPath)) {
    return sharp(iconPath)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toBuffer()
  }

  return createFallbackLogo(size)
}

async function createQrWithLogo(url: string, qrSize: number): Promise<Buffer> {
  const qrBuffer = await QRCode.toBuffer(url, {
    color: {
      dark: ABLAUT_QR_COLORS.greenDark,
      light: ABLAUT_QR_COLORS.white,
    },
    errorCorrectionLevel: 'H',
    margin: 1,
    width: qrSize,
  })

  const logoSize = Math.round(qrSize * 0.2)
  const padSize = Math.round(logoSize * 1.22)
  const logo = await loadLogoBuffer(Math.round(logoSize * 0.84))
  const padSvg = Buffer.from(
    `<svg width="${padSize}" height="${padSize}"><rect width="${padSize}" height="${padSize}" rx="${Math.round(padSize * 0.24)}" fill="white"/></svg>`,
  )
  const pad = await sharp(padSvg).png().toBuffer()
  const padOffset = Math.round((qrSize - padSize) / 2)
  const logoOffset = Math.round((qrSize - logoSize) / 2)

  return sharp(qrBuffer)
    .composite([
      { input: pad, left: padOffset, top: padOffset },
      { input: logo, left: logoOffset, top: logoOffset },
    ])
    .png()
    .toBuffer()
}

function buildCardSvg(input: BrandedQrCardInput, qrBase64: string): string {
  const footerLabel = input.footerLabel ?? defaultFooterLabel(input.kind)
  const primaryTitle = escapeXml(truncateTitle(input.primaryTitle, 42))
  const secondaryTitle = escapeXml(truncateTitle(input.secondaryTitle, 48))
  const footer = escapeXml(footerLabel)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${ABLAUT_QR_COLORS.card}"/>
      <stop offset="100%" stop-color="#eef5f4"/>
    </linearGradient>
    <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="${ABLAUT_QR_COLORS.greenDark}" flood-opacity="0.12"/>
    </filter>
  </defs>
  <rect x="24" y="24" width="672" height="852" rx="36" fill="url(#cardBg)" stroke="${ABLAUT_QR_COLORS.greenDark}" stroke-opacity="0.12" filter="url(#cardShadow)"/>
  <text x="360" y="98" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="30" font-weight="700" fill="${ABLAUT_QR_COLORS.greenDark}">${primaryTitle}</text>
  <text x="360" y="142" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="22" font-weight="600" fill="${ABLAUT_QR_COLORS.blueDark}">${secondaryTitle}</text>
  <line x1="120" y1="168" x2="600" y2="168" stroke="${ABLAUT_QR_COLORS.greenDark}" stroke-opacity="0.14" stroke-width="2"/>
  <rect x="150" y="196" width="${QR_SIZE}" height="${QR_SIZE}" rx="28" fill="white" stroke="${ABLAUT_QR_COLORS.blue}" stroke-opacity="0.22" stroke-width="2"/>
  <image href="data:image/png;base64,${qrBase64}" x="150" y="196" width="${QR_SIZE}" height="${QR_SIZE}" preserveAspectRatio="xMidYMid meet"/>
  <rect x="150" y="648" width="${QR_SIZE}" height="56" rx="14" fill="${ABLAUT_QR_COLORS.greenDark}"/>
  <text x="286" y="684" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="22" font-weight="700" letter-spacing="0.08em" fill="white">SCAN ME</text>
  <path d="M418 668 L452 684 L418 700" fill="none" stroke="${ABLAUT_QR_COLORS.blue}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="458" y1="684" x2="498" y2="684" stroke="${ABLAUT_QR_COLORS.blue}" stroke-width="4.5" stroke-linecap="round"/>
  <text x="360" y="748" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="14" font-weight="600" letter-spacing="0.16em" fill="${ABLAUT_QR_COLORS.muted}">${footer}</text>
  <text x="360" y="818" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="13" font-weight="600" fill="${ABLAUT_QR_COLORS.green}" opacity="0.85">ablaut</text>
</svg>`
}

export async function generateBrandedQrCardDataUrl(input: BrandedQrCardInput): Promise<string> {
  const qrWithLogo = await createQrWithLogo(input.url, QR_SIZE)
  const svg = buildCardSvg(input, qrWithLogo.toString('base64'))
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer()

  return `data:image/png;base64,${png.toString('base64')}`
}

export async function generateBrandedRouteQrDataUrl(input: {
  channelName: string
  organizationName: string
  url: string
  variant: 'listener' | 'speaker'
}): Promise<string> {
  return generateBrandedQrCardDataUrl({
    kind: input.variant,
    primaryTitle: input.organizationName,
    secondaryTitle: input.channelName,
    url: input.url,
  })
}

export async function generateBrandedDownloadQrDataUrl(input: {
  url: string
  version: string
}): Promise<string> {
  return generateBrandedQrCardDataUrl({
    footerLabel: 'android ablaut-app download',
    kind: 'download',
    primaryTitle: 'ablaut listener app',
    secondaryTitle: `Android v${input.version}`,
    url: input.url,
  })
}
