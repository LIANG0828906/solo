import type { BackgroundConfig, HandwritingStyle, StyleParams } from '../store/appStore'
import type { GeneratedResult, StrokePoint } from '../modules/handwritingGenerator'
import { strokesToSvgPath } from '../modules/handwritingGenerator'

function buildSvgString(
  result: GeneratedResult,
  styleParams: StyleParams,
  background: BackgroundConfig,
  width: number = 1200,
  height: number = 800
): string {
  const scaleX = (width - 80) / Math.max(result.totalWidth, 1)
  const scaleY = (height - 80) / Math.max(result.totalHeight, 1)
  const scale = Math.min(scaleX, scaleY, 1.5)
  const offsetX = (width - result.totalWidth * scale) / 2
  const offsetY = (height - result.totalHeight * scale) / 2

  const bgPatterns: Record<string, string> = {
    kraftPaper: `<rect width="${width}" height="${height}" fill="url(#kraftPaperGradient)"/>
      <defs>
        <linearGradient id="kraftPaperGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#d4b896"/>
          <stop offset="50%" stop-color="#c9a876"/>
          <stop offset="100%" stop-color="#b8956a"/>
        </linearGradient>
      </defs>`,
    chalkboard: `<rect width="${width}" height="${height}" fill="url(#chalkboardGradient)"/>
      <defs>
        <radialGradient id="chalkboardGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#2d5a3d"/>
          <stop offset="100%" stop-color="#1a3a28"/>
        </radialGradient>
      </defs>`,
    ricePaper: `<rect width="${width}" height="${height}" fill="#f8f4e8"/>`,
    linen: `<rect width="${width}" height="${height}" fill="#e8e0d0"/>`,
    frostedGlass: `<rect width="${width}" height="${height}" fill="rgba(255,255,255,0.7)"/>`,
    gradient: `<rect width="${width}" height="${height}" fill="url(#bgGradient)"/>
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f4ecd8"/>
          <stop offset="50%" stop-color="#e8dcc0"/>
          <stop offset="100%" stop-color="#d4c4a8"/>
        </linearGradient>
      </defs>`,
  }

  let pathData = ''
  for (const char of result.characters) {
    for (const stroke of char.strokes) {
      const d = strokesToSvgPath([stroke])
      if (d) {
        pathData += `<path d="${d}" fill="none" stroke="rgba(40,30,20,${styleParams.inkDensity})" stroke-width="${styleParams.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g opacity="${background.opacity}">
    ${bgPatterns[background.texture]}
  </g>
  <g transform="translate(${offsetX}, ${offsetY}) scale(${scale})">
    ${pathData}
  </g>
</svg>`
}

export async function exportAsPng(
  result: GeneratedResult,
  styleParams: StyleParams,
  background: BackgroundConfig,
  canvas: HTMLCanvasElement
): Promise<void> {
  const link = document.createElement('a')
  link.download = `handwriting-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export async function exportAsSvg(
  result: GeneratedResult,
  styleParams: StyleParams,
  background: BackgroundConfig
): Promise<void> {
  const svgString = buildSvgString(result, styleParams, background)
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `handwriting-${Date.now()}.svg`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

export async function exportAsSvz(
  result: GeneratedResult,
  styleParams: StyleParams,
  background: BackgroundConfig
): Promise<void> {
  const svgString = buildSvgString(result, styleParams, background)

  const metadata = JSON.stringify({
    version: '1.0',
    styleParams,
    background,
    createdAt: new Date().toISOString(),
  })

  const content = `SVZ1.0\n${metadata.length}\n${metadata}\n${svgString}`
  const blob = new Blob([content], { type: 'application/x-svz' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `handwriting-${Date.now()}.svz`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

export async function copySvgToClipboard(
  result: GeneratedResult,
  styleParams: StyleParams,
  background: BackgroundConfig
): Promise<boolean> {
  try {
    const svgString = buildSvgString(result, styleParams, background)
    await navigator.clipboard.writeText(svgString)
    return true
  } catch {
    return false
  }
}

export function getSvgString(
  result: GeneratedResult,
  styleParams: StyleParams,
  background: BackgroundConfig
): string {
  return buildSvgString(result, styleParams, background)
}
