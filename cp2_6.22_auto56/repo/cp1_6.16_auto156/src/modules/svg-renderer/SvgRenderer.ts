import Snap from 'snapsvg'
import { CharData, LineData } from '../../store/typographyStore'

export interface RenderOptions {
  fontFamily: string
  backgroundColor: string
  width: number
  height: number
  selectedCharId: string | null
  animationDuration?: number
}

export class SvgRenderer {
  private paper: Snap.Paper | null = null
  private container: HTMLElement | null = null
  private charElements: Map<string, Snap.Element> = new Map()
  private backgroundElement: Snap.Element | null = null
  private rootGroup: Snap.Element | null = null

  constructor(container: HTMLElement) {
    this.container = container
  }

  public init(width: number, height: number): void {
    if (!this.container) return
    this.container.innerHTML = ''
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.setAttribute('width', width.toString())
    svg.setAttribute('height', height.toString())
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`)
    svg.style.width = '100%'
    svg.style.height = '100%'
    this.container.appendChild(svg)
    this.paper = Snap(svg)
    this.charElements.clear()
    this.backgroundElement = null
    this.rootGroup = null
  }

  public render(
    lines: LineData[],
    options: RenderOptions
  ): void {
    if (!this.paper || !this.container) return

    const { fontFamily, backgroundColor, width, height, selectedCharId, animationDuration = 600 } = options

    if (!this.backgroundElement) {
      this.backgroundElement = this.paper.rect(0, 0, width, height)
      this.backgroundElement.attr({
        fill: backgroundColor,
      })
    } else {
      Snap.animate(
        this.hexToRgb(this.backgroundElement.attr('fill') as string) || { r: 255, g: 255, b: 255 },
        this.hexToRgb(backgroundColor) || { r: 255, g: 255, b: 255 },
        (val: { r: number; g: number; b: number }) => {
          if (this.backgroundElement) {
            this.backgroundElement.attr({ fill: `rgb(${Math.round(val.r)},${Math.round(val.g)},${Math.round(val.b)})` })
          }
        },
        800,
        mina.easeinout
      )
    }

    if (!this.rootGroup) {
      this.rootGroup = this.paper.g()
    }

    const allCurrentIds = new Set<string>()
    lines.forEach(line => {
      line.chars.forEach(char => {
        allCurrentIds.add(char.id)
      })
    })

    this.charElements.forEach((el, id) => {
      if (!allCurrentIds.has(id)) {
        el.remove()
        this.charElements.delete(id)
      }
    })

    lines.forEach(line => {
      line.chars.forEach(char => {
        this.renderChar(char, fontFamily, selectedCharId, animationDuration)
      })
    })
  }

  private renderChar(
    char: CharData,
    fontFamily: string,
    selectedCharId: string | null,
    animationDuration: number
  ): void {
    if (!this.paper || !this.rootGroup) return

    let el = this.charElements.get(char.id)

    if (!el) {
      el = this.paper.text(char.x, char.y, char.char)
      if (this.rootGroup) {
        this.rootGroup.add(el)
      }
      this.charElements.set(char.id, el)
      el.attr({
        x: char.x,
        y: char.y,
        'font-family': fontFamily,
        'font-size': char.fontSize,
        'font-weight': char.fontWeight,
        'font-style': char.fontStyle,
        fill: char.color,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
        transform: `r(${char.rotation}, ${char.x}, ${char.y})`,
        cursor: 'pointer',
      })
    } else {
      const currentX = parseFloat(el.attr('x') as string) || char.x
      const currentY = parseFloat(el.attr('y') as string) || char.y
      const currentTransform = el.attr('transform') as string || ''
      const currentRotationMatch = currentTransform.match(/r\(([-\d.]+)/)
      const currentRotation = currentRotationMatch ? parseFloat(currentRotationMatch[1]) : char.rotation

      if (Math.abs(currentX - char.x) > 0.1 || Math.abs(currentY - char.y) > 0.1 ||
          Math.abs(currentRotation - char.rotation) > 0.1) {
        Snap.animate(
          { x: currentX, y: currentY, rotation: currentRotation },
          { x: char.x, y: char.y, rotation: char.rotation },
          (val: { x: number; y: number; rotation: number }) => {
            if (el && this.charElements.has(char.id)) {
              el.attr({
                x: val.x,
                y: val.y,
                transform: `r(${val.rotation}, ${val.x}, ${val.y})`,
              })
            }
          },
          animationDuration,
          mina.easeinout
        )
      }

      const currentFill = el.attr('fill') as string
      if (currentFill !== char.color) {
        const fromColor = this.hexToRgb(currentFill) || { r: 0, g: 0, b: 0 }
        const toColor = this.hexToRgb(char.color) || { r: 0, g: 0, b: 0 }
        Snap.animate(
          fromColor,
          toColor,
          (val: { r: number; g: number; b: number }) => {
            if (el && this.charElements.has(char.id)) {
              el.attr({ fill: `rgb(${Math.round(val.r)},${Math.round(val.g)},${Math.round(val.b)})` })
            }
          },
          800,
          mina.easeinout
        )
      }

      el.attr({
        'font-family': fontFamily,
        'font-size': char.fontSize,
        'font-weight': char.fontWeight,
        'font-style': char.fontStyle,
        'text-anchor': 'middle',
        'dominant-baseline': 'middle',
      })
    }

    if (selectedCharId === char.id) {
      const bbox = el.getBBox()
      let highlightEl = el.paper.select(`[data-highlight="${char.id}"]`)
      if (!highlightEl) {
        highlightEl = el.paper.rect(bbox.x - 4, bbox.y - 4, bbox.width + 8, bbox.height + 8)
        highlightEl.attr({
          'data-highlight': char.id,
          fill: 'none',
          stroke: '#9E9E9E',
          'stroke-width': 2,
          'stroke-dasharray': '5,3',
          'pointer-events': 'none',
        })
        if (this.rootGroup) {
          this.rootGroup.add(highlightEl)
        }
      } else {
        highlightEl.attr({
          x: bbox.x - 4,
          y: bbox.y - 4,
          width: bbox.width + 8,
          height: bbox.height + 8,
        })
      }
    } else {
      const highlightEl = el.paper.select(`[data-highlight="${char.id}"]`)
      if (highlightEl) {
        highlightEl.remove()
      }
    }
  }

  public updateHighlights(lines: LineData[], selectedCharId: string | null): void {
    if (!this.paper) return

    this.paper.selectAll('[data-highlight]').forEach(el => el.remove())

    if (!selectedCharId) return

    const el = this.charElements.get(selectedCharId)
    if (!el) return

    const bbox = el.getBBox()
    const highlightEl = this.paper.rect(bbox.x - 4, bbox.y - 4, bbox.width + 8, bbox.height + 8)
    highlightEl.attr({
      'data-highlight': selectedCharId,
      fill: 'none',
      stroke: '#9E9E9E',
      'stroke-width': 2,
      'stroke-dasharray': '5,3',
      'pointer-events': 'none',
    })
    if (this.rootGroup) {
      this.rootGroup.add(highlightEl)
    }
  }

  public exportSVG(
    lines: LineData[],
    options: RenderOptions
  ): string {
    const { fontFamily, backgroundColor, selectedCharId } = options

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    lines.forEach(line => {
      line.chars.forEach(char => {
        minX = Math.min(minX, char.x - char.fontSize / 2)
        minY = Math.min(minY, char.y - char.fontSize)
        maxX = Math.max(maxX, char.x + char.fontSize / 2)
        maxY = Math.max(maxY, char.y + char.fontSize / 2)
      })
    })

    if (minX === Infinity) {
      minX = 0; minY = 0; maxX = 100; maxY = 100
    }

    const margin = 2
    minX -= margin
    minY -= margin
    maxX += margin
    maxY += margin

    const width = maxX - minX
    const height = maxY - minY

    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>\n`
    svgContent += `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n`
    svgContent += `  <rect width="100%" height="100%" fill="${backgroundColor}"/>\n`

    lines.forEach(line => {
      line.chars.forEach(char => {
        const x = char.x - minX
        const y = char.y - minY
        svgContent += `  <text x="${x.toFixed(2)}" y="${y.toFixed(2)}" `
        svgContent += `font-family="${fontFamily}" `
        svgContent += `font-size="${char.fontSize}" `
        svgContent += `font-weight="${char.fontWeight}" `
        if (char.fontStyle === 'italic') {
          svgContent += `font-style="italic" `
        }
        svgContent += `fill="${char.color}" `
        svgContent += `text-anchor="middle" `
        svgContent += `dominant-baseline="middle"`
        if (char.rotation !== 0) {
          svgContent += ` transform="rotate(${char.rotation.toFixed(2)}, ${x.toFixed(2)}, ${y.toFixed(2)})"`
        }
        svgContent += `>${this.escapeXml(char.char)}</text>\n`
      })
    })

    svgContent += `</svg>`
    return svgContent
  }

  public getCharElementAtPoint(clientX: number, clientY, svgRect: DOMRect): CharData | null {
    return null
  }

  public getCharIds(): string[] {
    return Array.from(this.charElements.keys())
  }

  public getCharElement(id: string): Snap.Element | undefined {
    return this.charElements.get(id)
  }

  public clear(): void {
    this.charElements.forEach(el => el.remove())
    this.charElements.clear()
    if (this.backgroundElement) {
      this.backgroundElement.remove()
      this.backgroundElement = null
    }
    if (this.rootGroup) {
      this.rootGroup.remove()
      this.rootGroup = null
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    if (!hex) return null
    if (hex.startsWith('rgb')) {
      const match = hex.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (match) {
        return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) }
      }
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null
  }

  private escapeXml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }
}
