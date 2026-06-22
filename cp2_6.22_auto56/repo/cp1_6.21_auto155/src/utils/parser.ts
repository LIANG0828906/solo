import { parse, walk } from 'css-tree'
import { v4 as uuidv4 } from 'uuid'

export interface ColorItem {
  id: string
  value: string
  format: 'hex' | 'rgb' | 'rgba' | 'hsl' | 'hsla'
}

function detectFormat(value: string): ColorItem['format'] {
  const lower = value.toLowerCase().trim()
  if (lower.startsWith('#')) return 'hex'
  if (lower.startsWith('rgba(')) return 'rgba'
  if (lower.startsWith('rgb(')) return 'rgb'
  if (lower.startsWith('hsla(')) return 'hsla'
  if (lower.startsWith('hsl(')) return 'hsl'
  return 'hex'
}

function normalizeColor(value: string): string {
  return value.trim().toLowerCase()
}

export function parseColors(css: string): ColorItem[] {
  const colors: ColorItem[] = []
  const seen = new Set<string>()

  try {
    const ast = parse(css, {
      onParseError: () => {}
    })

    walk(ast, (node) => {
      if (node.type === 'Hash') {
        const value = '#' + node.value
        const normalized = normalizeColor(value)
        if (!seen.has(normalized)) {
          seen.add(normalized)
          colors.push({
            id: uuidv4(),
            value,
            format: 'hex'
          })
        }
      }

      if (node.type === 'Function') {
        const name = node.name.toLowerCase()
        if (['rgb', 'rgba', 'hsl', 'hsla'].includes(name)) {
          let value = ''
          if (node.children) {
            const childrenVals: string[] = []
            node.children.forEach((child: any) => {
              if (child.type === 'Number') {
                childrenVals.push(child.value)
              } else if (child.type === 'Percentage') {
                childrenVals.push(child.value + '%')
              } else if (child.type === 'Operator') {
                childrenVals.push(child.value)
              } else if (child.type === 'Identifier') {
                childrenVals.push(child.name)
              }
            })
            value = `${name}(${childrenVals.join(', ')})`
          } else {
            value = `${name}()`
          }

          const normalized = normalizeColor(value)
          if (!seen.has(normalized)) {
            seen.add(normalized)
            colors.push({
              id: uuidv4(),
              value,
              format: detectFormat(value)
            })
          }
        }
      }
    })
  } catch (e) {
    const regexPatterns = [
      /#([0-9a-fA-F]{3,8})\b/g,
      /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/gi,
      /hsla?\(\s*\d+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(?:,\s*[\d.]+\s*)?\)/gi
    ]

    for (const pattern of regexPatterns) {
      let match
      while ((match = pattern.exec(css)) !== null) {
        const value = match[0]
        const normalized = normalizeColor(value)
        if (!seen.has(normalized)) {
          seen.add(normalized)
          colors.push({
            id: uuidv4(),
            value,
            format: detectFormat(value)
          })
        }
      }
    }
  }

  return colors
}

export function parseColorsAsync(css: string): Promise<ColorItem[]> {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        resolve(parseColors(css))
      })
    } else {
      setTimeout(() => {
        resolve(parseColors(css))
      }, 0)
    }
  })
}
