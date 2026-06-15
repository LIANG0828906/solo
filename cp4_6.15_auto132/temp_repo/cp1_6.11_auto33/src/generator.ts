import type { StyleEntry } from './dropper'

export interface GeneratedCSS {
  code: string
  colorCount: number
  fontCount: number
  sizeCount: number
}

function uniqFonts(entries: StyleEntry[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const e of entries) {
    const name = e.fontName.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      result.push(name)
    }
  }
  return result
}

function sortedUniqSizes(entries: StyleEntry[]): number[] {
  const seen = new Set<number>()
  const result: number[] = []
  for (const e of entries) {
    const sz = Math.round(e.fontSize)
    if (sz <= 0) continue
    if (!seen.has(sz)) {
      seen.add(sz)
      result.push(sz)
    }
  }
  return result.sort((a, b) => a - b)
}

export function generateCSSVariables(entries: StyleEntry[]): GeneratedCSS {
  const lines: string[] = []
  lines.push(':root {')

  const colors: string[] = []
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    const n = i + 1
    const hex = e.hex.startsWith('#') ? e.hex : '#' + e.hex
    colors.push(`  --color-${n}: ${hex};`)
  }
  lines.push(...colors)

  const fonts = uniqFonts(entries)
  const fontLines: string[] = []
  for (let i = 0; i < fonts.length; i++) {
    const name = fonts[i]
    const escaped = name.replace(/'/g, "\\'")
    fontLines.push(`  --font-${i + 1}: '${escaped}';`)
  }
  lines.push(...fontLines)

  const sizes = sortedUniqSizes(entries)
  const sizeLines: string[] = []
  for (let i = 0; i < sizes.length; i++) {
    sizeLines.push(`  --size-${i + 1}: ${sizes[i]}px;`)
  }
  lines.push(...sizeLines)

  lines.push('}')

  return {
    code: lines.join('\n'),
    colorCount: colors.length,
    fontCount: fonts.length,
    sizeCount: sizes.length
  }
}

export function highlightCSS(code: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  let html = escape(code)

  html = html.replace(/(:root)(\s*)/g, '<span style="color:#c678dd">$1</span>$2')
  html = html.replace(/(--[a-zA-Z0-9-]+)(:)/g, '<span style="color:#61afef">$1</span>$2')
  html = html.replace(/(#[0-9a-fA-F]{3,8})(?=[\s;])/g, '<span style="color:#98c379">$1</span>')
  html = html.replace(/(\d+px)(?=[\s;])/g, '<span style="color:#d19a66">$1</span>')
  html = html.replace(/('[^']*')(?=[\s;])/g, '<span style="color:#e5c07b">$1</span>')
  html = html.replace(/([{};])/g, '<span style="color:#abb2bf">$1</span>')

  const withLineNumbers = html
    .split('\n')
    .map((line, idx) => {
      const lineNum = String(idx + 1).padStart(2, ' ')
      return (
        `<div style="display:flex"><span style="display:inline-block;width:32px;min-width:32px;text-align:right;padding-right:12px;color:#5c6370;user-select:none;border-right:1px solid #3e4452;margin-right:12px;flex-shrink:0">${lineNum}</span><span style="flex:1;white-space:pre-wrap">${line || '&nbsp;'}</span></div>`
      )
    })
    .join('')

  return withLineNumbers
}
