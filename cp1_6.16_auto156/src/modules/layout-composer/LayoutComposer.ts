import { Alignment, CharData, LineData, PathType } from '../../store/typographyStore'

export interface LayoutParams {
  fontFamily: string
  fontSize: number
  fontWeight: number
  lineHeight: number
  letterSpacing: number
  textColor: string
  accentColor: string
  pathType: PathType
  pathRadius: number
  spiralTurns: number
  waveAmplitude: number
  lastCharSpecial: boolean
  canvasWidth: number
  canvasHeight: number
}

export interface ComputedLayout {
  lines: LineData[]
  bounds: {
    minX: number
    minY: number
    maxX: number
    maxY: number
    width: number
    height: number
  }
}

export class LayoutComposer {
  private static charWidthCache = new Map<string, number>()

  public static estimateCharWidth(char: string, fontSize: number, fontFamily: string): number {
    const cacheKey = `${char}|${fontSize}|${fontFamily}`
    if (this.charWidthCache.has(cacheKey)) {
      return this.charWidthCache.get(cacheKey)!
    }
    const isCJK = /[\u4e00-\u9fff\u3400-\u4dbf]/.test(char)
    const width = isCJK ? fontSize : fontSize * 0.6
    this.charWidthCache.set(cacheKey, width)
    return width
  }

  public static computeLayout(
    lines: LineData[],
    params: LayoutParams
  ): ComputedLayout {
    const {
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      textColor,
      accentColor,
      pathType,
      pathRadius,
      spiralTurns,
      waveAmplitude,
      lastCharSpecial,
      canvasWidth,
      canvasHeight,
    } = params

    let computedLines: LineData[] = []
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    if (pathType === 'linear') {
      computedLines = this.computeLinearLayout(
        lines,
        {
          fontSize,
          fontWeight,
          lineHeight,
          letterSpacing,
          textColor,
          accentColor,
          lastCharSpecial,
          canvasWidth,
          canvasHeight,
        }
      )
    } else if (pathType === 'circle') {
      computedLines = this.computeCircleLayout(
        lines,
        {
          fontSize,
          fontWeight,
          letterSpacing,
          textColor,
          accentColor,
          lastCharSpecial,
          centerX,
          centerY,
          radius: pathRadius,
        }
      )
    } else if (pathType === 'spiral') {
      computedLines = this.computeSpiralLayout(
        lines,
        {
          fontSize,
          fontWeight,
          letterSpacing,
          textColor,
          accentColor,
          lastCharSpecial,
          centerX,
          centerY,
          radius: pathRadius,
          turns: spiralTurns,
        }
      )
    } else if (pathType === 'wave') {
      computedLines = this.computeWaveLayout(
        lines,
        {
          fontSize,
          fontWeight,
          lineHeight,
          letterSpacing,
          textColor,
          accentColor,
          lastCharSpecial,
          canvasWidth,
          canvasHeight,
          amplitude: waveAmplitude,
        }
      )
    }

    const bounds = this.calculateBounds(computedLines)
    return { lines: computedLines, bounds }
  }

  private static computeLinearLayout(
    lines: LineData[],
    params: {
      fontSize: number
      fontWeight: number
      lineHeight: number
      letterSpacing: number
      textColor: string
      accentColor: string
      lastCharSpecial: boolean
      canvasWidth: number
      canvasHeight: number
    }
  ): LineData[] {
    const {
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      textColor,
      accentColor,
      lastCharSpecial,
      canvasWidth,
      canvasHeight,
    } = params

    const lineSpacing = fontSize * lineHeight
    const totalHeight = lines.length * lineSpacing
    const startY = (canvasHeight - totalHeight) / 2 + fontSize

    return lines.map((line, lineIndex) => {
      const charWidths = line.chars.map(c =>
        this.estimateCharWidth(c.char, fontSize, '') + letterSpacing
      )
      const totalWidth = charWidths.reduce((a, b) => a + b, 0) - letterSpacing
      const baseY = startY + lineIndex * lineSpacing

      let startX = (canvasWidth - totalWidth) / 2
      if (line.alignment === 'left') {
        startX = (canvasWidth - totalWidth) / 2 - 100
      } else if (line.alignment === 'right') {
        startX = (canvasWidth - totalWidth) / 2 + 100
      }

      const computedChars: CharData[] = line.chars.map((char, charIndex) => {
        const isLast = charIndex === line.chars.length - 1
        const x = startX + charWidths.slice(0, charIndex).reduce((a, b) => a + b, 0)
        let finalColor = textColor
        let finalWeight = fontWeight
        let fontStyle: 'normal' | 'italic' = 'normal'

        if (lastCharSpecial && isLast) {
          finalColor = accentColor
          finalWeight = Math.min(fontWeight + 300, 900)
          fontStyle = 'italic'
        }

        return {
          ...char,
          x: x + char.manualOffsetX,
          y: baseY + char.manualOffsetY,
          rotation: 0,
          fontSize,
          color: finalColor,
          fontWeight: finalWeight,
          fontStyle,
          isLastInLine: isLast,
          lineIndex,
        }
      })

      return { ...line, chars: computedChars }
    })
  }

  private static computeCircleLayout(
    lines: LineData[],
    params: {
      fontSize: number
      fontWeight: number
      letterSpacing: number
      textColor: string
      accentColor: string
      lastCharSpecial: boolean
      centerX: number
      centerY: number
      radius: number
    }
  ): LineData[] {
    const {
      fontSize,
      fontWeight,
      letterSpacing,
      textColor,
      accentColor,
      lastCharSpecial,
      centerX,
      centerY,
      radius,
    } = params

    const allChars: { char: CharData; lineIndex: number; lineId: string; lineAlignment: Alignment }[] = []
    lines.forEach(line => {
      line.chars.forEach(c => {
        allChars.push({ char: c, lineIndex: line.chars.indexOf(c), lineId: line.id, lineAlignment: line.alignment })
      })
    })

    const totalChars = allChars.length
    if (totalChars === 0) return lines

    const charAngle = (2 * Math.PI) / totalChars
    const angleSpacing = (fontSize + letterSpacing) / radius

    return lines.map(line => {
      const computedChars: CharData[] = line.chars.map((char, charIndex) => {
        const globalIndex = allChars.findIndex(
          ac => ac.char.id === char.id
        )
        const angle = globalIndex * angleSpacing - Math.PI / 2
        const x = centerX + radius * Math.cos(angle)
        const y = centerY + radius * Math.sin(angle)
        const rotation = (angle * 180) / Math.PI + 90

        const isLast = charIndex === line.chars.length - 1
        let finalColor = textColor
        let finalWeight = fontWeight
        let fontStyle: 'normal' | 'italic' = 'normal'

        if (lastCharSpecial && isLast) {
          finalColor = accentColor
          finalWeight = Math.min(fontWeight + 300, 900)
          fontStyle = 'italic'
        }

        return {
          ...char,
          x: x + char.manualOffsetX,
          y: y + char.manualOffsetY,
          rotation,
          fontSize,
          color: finalColor,
          fontWeight: finalWeight,
          fontStyle,
          isLastInLine: isLast,
        }
      })
      return { ...line, chars: computedChars }
    })
  }

  private static computeSpiralLayout(
    lines: LineData[],
    params: {
      fontSize: number
      fontWeight: number
      letterSpacing: number
      textColor: string
      accentColor: string
      lastCharSpecial: boolean
      centerX: number
      centerY: number
      radius: number
      turns: number
    }
  ): LineData[] {
    const {
      fontSize,
      fontWeight,
      letterSpacing,
      textColor,
      accentColor,
      lastCharSpecial,
      centerX,
      centerY,
      radius,
      turns,
    } = params

    const allChars: { char: CharData; lineIndex: number }[] = []
    lines.forEach(line => {
      line.chars.forEach(c => {
        allChars.push({ char: c, lineIndex: line.chars.indexOf(c) })
      })
    })

    const totalChars = allChars.length
    if (totalChars === 0) return lines

    const maxAngle = turns * 2 * Math.PI
    const startRadius = radius * 0.3
    const endRadius = radius

    return lines.map(line => {
      const computedChars: CharData[] = line.chars.map((char, charIndex) => {
        const globalIndex = allChars.findIndex(ac => ac.char.id === char.id)
        const t = globalIndex / Math.max(totalChars - 1, 1)
        const angle = t * maxAngle - Math.PI / 2
        const currentRadius = startRadius + t * (endRadius - startRadius)
        const x = centerX + currentRadius * Math.cos(angle)
        const y = centerY + currentRadius * Math.sin(angle)
        const rotation = (angle * 180) / Math.PI + 90

        const isLast = charIndex === line.chars.length - 1
        let finalColor = textColor
        let finalWeight = fontWeight
        let fontStyle: 'normal' | 'italic' = 'normal'

        if (lastCharSpecial && isLast) {
          finalColor = accentColor
          finalWeight = Math.min(fontWeight + 300, 900)
          fontStyle = 'italic'
        }

        return {
          ...char,
          x: x + char.manualOffsetX,
          y: y + char.manualOffsetY,
          rotation,
          fontSize,
          color: finalColor,
          fontWeight: finalWeight,
          fontStyle,
          isLastInLine: isLast,
        }
      })
      return { ...line, chars: computedChars }
    })
  }

  private static computeWaveLayout(
    lines: LineData[],
    params: {
      fontSize: number
      fontWeight: number
      lineHeight: number
      letterSpacing: number
      textColor: string
      accentColor: string
      lastCharSpecial: boolean
      canvasWidth: number
      canvasHeight: number
      amplitude: number
    }
  ): LineData[] {
    const {
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
      textColor,
      accentColor,
      lastCharSpecial,
      canvasWidth,
      canvasHeight,
      amplitude,
    } = params

    const lineSpacing = fontSize * lineHeight
    const totalHeight = lines.length * lineSpacing
    const startY = (canvasHeight - totalHeight) / 2 + fontSize

    return lines.map((line, lineIndex) => {
      const charWidths = line.chars.map(c =>
        this.estimateCharWidth(c.char, fontSize, '') + letterSpacing
      )
      const totalWidth = charWidths.reduce((a, b) => a + b, 0) - letterSpacing
      const startX = (canvasWidth - totalWidth) / 2
      const baseY = startY + lineIndex * lineSpacing

      const computedChars: CharData[] = line.chars.map((char, charIndex) => {
        const x = startX + charWidths.slice(0, charIndex).reduce((a, b) => a + b, 0)
        const normalizedX = totalWidth > 0 ? (x - startX) / totalWidth : 0
        const waveY = baseY + Math.sin(normalizedX * Math.PI * 2 + lineIndex * 0.5) * amplitude
        const rotation = Math.cos(normalizedX * Math.PI * 2 + lineIndex * 0.5) * 10

        const isLast = charIndex === line.chars.length - 1
        let finalColor = textColor
        let finalWeight = fontWeight
        let fontStyle: 'normal' | 'italic' = 'normal'

        if (lastCharSpecial && isLast) {
          finalColor = accentColor
          finalWeight = Math.min(fontWeight + 300, 900)
          fontStyle = 'italic'
        }

        return {
          ...char,
          x: x + char.manualOffsetX,
          y: waveY + char.manualOffsetY,
          rotation,
          fontSize,
          color: finalColor,
          fontWeight: finalWeight,
          fontStyle,
          isLastInLine: isLast,
          lineIndex,
        }
      })

      return { ...line, chars: computedChars }
    })
  }

  private static calculateBounds(lines: LineData[]) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    lines.forEach(line => {
      line.chars.forEach(char => {
        minX = Math.min(minX, char.x)
        minY = Math.min(minY, char.y - char.fontSize)
        maxX = Math.max(maxX, char.x + char.fontSize)
        maxY = Math.max(maxY, char.y)
      })
    })

    if (minX === Infinity) {
      minX = 0
      minY = 0
      maxX = 100
      maxY = 100
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }
}
