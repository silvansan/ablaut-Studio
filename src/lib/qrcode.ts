import QRCode from 'qrcode'

export {
  generateBrandedDownloadQrDataUrl,
  generateBrandedQrCardDataUrl,
  generateBrandedRouteQrDataUrl,
} from '@/lib/branded-qrcode'

const defaultOptions = {
  color: {
    dark: '#163f35',
    light: '#ffffff',
  },
  margin: 2,
  width: 512,
}

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, defaultOptions)
}

export async function generateQrBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, defaultOptions)
}
