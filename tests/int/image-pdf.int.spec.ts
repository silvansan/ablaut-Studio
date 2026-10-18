// @vitest-environment node
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { buildImagePdf } from '@/lib/image-pdf'

async function png(width: number, height: number, color: string) {
  return sharp({ create: { background: color, channels: 3, height, width } }).png().toBuffer()
}

describe('buildImagePdf', () => {
  it('writes a valid single-image-per-page PDF', async () => {
    const pdf = await buildImagePdf([await png(120, 160, '#163f35'), await png(200, 100, '#126bb6'), await png(80, 80, '#ffffff')])
    const text = pdf.toString('latin1')

    expect(text.startsWith('%PDF-1.4')).toBe(true)
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true)
    expect(text).toContain('/Count 3')
    expect(text.match(/\/Subtype \/Image/g)).toHaveLength(3)
  })

  it('has a cross-reference table whose offsets point at the objects', async () => {
    const pdf = await buildImagePdf([await png(50, 50, '#000000'), await png(50, 90, '#2f8f63')])
    const text = pdf.toString('latin1')
    const startxref = Number(/startxref\n(\d+)\n%%EOF/.exec(text)?.[1])

    expect(text.slice(startxref, startxref + 4)).toBe('xref')

    const rows = text
      .slice(startxref)
      .split('\n')
      .filter((line) => /^\d{10} 00000 n $/.test(line) || /^\d{10} 00000 n$/.test(line))

    expect(rows).toHaveLength(2 * 3 + 2)

    rows.forEach((row, index) => {
      const offset = Number(row.slice(0, 10))
      expect(text.slice(offset, offset + `${index + 1} 0 obj`.length)).toBe(`${index + 1} 0 obj`)
    })
  })

  it('fits each image inside the A4 page without distorting it', async () => {
    const pdf = await buildImagePdf([await png(100, 200, '#000000')], { margin: 36 })
    const match = /q ([\d.]+) 0 0 ([\d.]+) ([\d.]+) ([\d.]+) cm/.exec(pdf.toString('latin1'))
    const [width, height, x, y] = (match ?? []).slice(1).map(Number)

    expect(width! / height!).toBeCloseTo(0.5, 2)
    expect(x).toBeGreaterThanOrEqual(36)
    expect(y).toBeGreaterThanOrEqual(36)
    expect(x! + width!).toBeLessThanOrEqual(595.28 - 36 + 0.01)
    expect(y! + height!).toBeLessThanOrEqual(841.89 - 36 + 0.01)
  })

  it('refuses to build an empty document', async () => {
    await expect(buildImagePdf([])).rejects.toThrow()
  })
})
