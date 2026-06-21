import { saveAs } from 'file-saver'
import type { ColorItem } from './parser'

export function convertToCSSVariables(colors: ColorItem[]): string {
  return colors
    .map((color, index) => `--color-${index + 1}: ${color.value};`)
    .join(' ')
}

export function exportToJSON(colors: ColorItem[]): void {
  const data = JSON.stringify(colors, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  saveAs(blob, 'color-palette.json')
}

export function exportToCSS(colors: ColorItem[]): void {
  const cssString = `:root {
${colors.map((color, index) => `  --color-${index + 1}: ${color.value};`).join('\n')}
}`
  const blob = new Blob([cssString], { type: 'text/css' })
  saveAs(blob, 'color-variables.css')
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
  }
  return new Promise((resolve, reject) => {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      resolve()
    } catch (e) {
      reject(e)
    }
    document.body.removeChild(textarea)
  })
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}
