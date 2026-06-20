import type { ColorItem } from './colorAnalysis'

export function toCSSVariables(colors: ColorItem[]): string {
  const variables = colors
    .map((color) => {
      const name = color.name.replace(/\s+/g, '-').toLowerCase()
      return `  --${name}: ${color.value};`
    })
    .join('\n')

  return `:root {\n${variables}\n}`
}

export function toFigmaJSON(colors: ColorItem[], name = 'Palette'): string {
  const figmaData = {
    name,
    exportFormat: 'Figma',
    colors: colors.map((color) => ({
      name: color.name,
      value: color.value,
      type: color.type || 'SOLID'
    }))
  }

  return JSON.stringify(figmaData, null, 2)
}

export function toSketchJSON(colors: ColorItem[]): string {
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255
        }
      : { r: 0, g: 0, b: 0 }
  }

  const sketchData = {
    colors: colors.map((color) => {
      const rgb = hexToRgb(color.value)
      return {
        name: color.name,
        red: rgb.r,
        green: rgb.g,
        blue: rgb.b,
        alpha: color.alpha ?? 1
      }
    })
  }

  return JSON.stringify(sketchData, null, 2)
}

export function downloadFile(content: string, filename: string, mimeType = 'text/plain'): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
