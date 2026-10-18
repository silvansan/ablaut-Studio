import { deflateSync } from 'node:zlib'

import sharp from 'sharp'

/** A4 portrait in PDF points (1/72 inch). */
const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const DEFAULT_MARGIN = 36

type DecodedImage = { data: Buffer; height: number; width: number }

async function decodeToRgb(png: Buffer): Promise<DecodedImage> {
  // Flatten transparency onto white: a QR must print dark-on-light, never on a transparent page.
  const { data, info } = await sharp(png)
    .flatten({ background: '#ffffff' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return { data: deflateSync(data), height: info.height, width: info.width }
}

/**
 * Builds a PDF with one image per A4 page, centered and scaled to the largest size that fits the
 * margins. Lossless (raw RGB, Flate-compressed), so QR edges stay crisp. Print dialogs can then
 * place one or two pages per sheet on their own.
 */
export async function buildImagePdf(pngs: Buffer[], options: { margin?: number } = {}): Promise<Buffer> {
  if (pngs.length === 0) {
    throw new Error('A PDF needs at least one image.')
  }

  const margin = options.margin ?? DEFAULT_MARGIN
  const images = await Promise.all(pngs.map(decodeToRgb))
  const chunks: Buffer[] = []
  const offsets: number[] = []
  let position = 0

  function write(part: Buffer | string) {
    const buffer = typeof part === 'string' ? Buffer.from(part, 'latin1') : part
    chunks.push(buffer)
    position += buffer.length
  }

  function object(id: number, body: (Buffer | string)[]) {
    offsets[id] = position
    write(`${id} 0 obj\n`)
    for (const part of body) {
      write(part)
    }
    write('\nendobj\n')
  }

  // Object ids: 1 catalog, 2 page tree, then three per page (page, content stream, image).
  const pageId = (index: number) => 3 + index * 3
  const contentId = (index: number) => pageId(index) + 1
  const imageId = (index: number) => pageId(index) + 2

  write('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  object(1, ['<< /Type /Catalog /Pages 2 0 R >>'])
  object(2, [
    `<< /Type /Pages /Count ${images.length} /Kids [${images.map((_, index) => `${pageId(index)} 0 R`).join(' ')}] >>`,
  ])

  images.forEach((image, index) => {
    const scale = Math.min((PAGE_WIDTH - margin * 2) / image.width, (PAGE_HEIGHT - margin * 2) / image.height)
    const drawWidth = image.width * scale
    const drawHeight = image.height * scale
    const x = (PAGE_WIDTH - drawWidth) / 2
    const y = (PAGE_HEIGHT - drawHeight) / 2
    const content = `q ${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im0 Do Q`

    object(pageId(index), [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /XObject << /Im0 ${imageId(index)} 0 R >> >> /Contents ${contentId(index)} 0 R >>`,
    ])
    object(contentId(index), [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`])
    object(imageId(index), [
      `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} ` +
        `/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${image.data.length} >>\nstream\n`,
      image.data,
      '\nendstream',
    ])
  })

  const objectCount = 3 + (images.length - 1) * 3 + 3
  const xrefStart = position

  write(`xref\n0 ${objectCount}\n0000000000 65535 f \n`)
  for (let id = 1; id < objectCount; id += 1) {
    write(`${String(offsets[id]).padStart(10, '0')} 00000 n \n`)
  }
  write(`trailer\n<< /Size ${objectCount} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`)

  return Buffer.concat(chunks)
}
