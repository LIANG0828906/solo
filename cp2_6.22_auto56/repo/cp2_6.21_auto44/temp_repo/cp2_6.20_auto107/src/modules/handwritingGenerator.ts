import type { HandwritingStyle, StyleParams } from '../store/appStore'

export interface StrokePoint {
  x: number
  y: number
  pressure: number
}

export interface CharacterPath {
  char: string
  strokes: StrokePoint[][]
  boundingBox: { x: number; y: number; width: number; height: number }
}

export interface GeneratedResult {
  characters: CharacterPath[]
  totalWidth: number
  totalHeight: number
}

const pathCache = new Map<string, CharacterPath>()

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function charToSeed(char: string, style: HandwritingStyle): number {
  let hash = 0
  const combined = char + style
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function generateStrokesForCharacter(
  char: string,
  style: HandwritingStyle,
  params: StyleParams
): StrokePoint[][] {
  const seed = charToSeed(char, style)
  const rand = seededRandom(seed)
  const strokes: StrokePoint[][] = []

  const isCJK = /[\u4e00-\u9fa5]/.test(char)
  const isLetter = /[a-zA-Z]/.test(char)
  const isDigit = /[0-9]/.test(char)

  let baseWidth = 60
  let baseHeight = 80

  if (isLetter || isDigit) {
    baseWidth = char === 'm' || char === 'M' || char === 'w' || char === 'W' ? 50 : 35
    baseHeight = 60
  } else if (!isCJK) {
    baseWidth = 30
    baseHeight = 60
  }

  const strokeCount = isCJK
    ? Math.floor(rand() * 6) + 4
    : isLetter || isDigit
    ? Math.floor(rand() * 2) + 1
    : 1

  for (let s = 0; s < strokeCount; s++) {
    const stroke: StrokePoint[] = []
    const pointsCount = Math.floor(rand() * 8) + 6

    const startX = rand() * baseWidth * 0.6 + baseWidth * 0.1
    const startY = rand() * baseHeight * 0.5 + baseHeight * 0.1
    const endX = rand() * baseWidth * 0.6 + baseWidth * 0.2
    const endY = rand() * baseHeight * 0.5 + baseHeight * 0.35

    for (let p = 0; p < pointsCount; p++) {
      const t = p / (pointsCount - 1)
      let x: number, y: number

      switch (style) {
        case 'roundChild': {
          const wobble = Math.sin(t * Math.PI * 3) * 4 + (rand() - 0.5) * 3
          x = startX + (endX - startX) * t + wobble
          y = startY + (endY - startY) * t + (rand() - 0.5) * 5
          break
        }
        case 'elegantRunning': {
          const curve = Math.sin(t * Math.PI) * 12
          x = startX + (endX - startX) * t + curve * 0.3
          y = startY + (endY - startY) * t + curve + (rand() - 0.5) * 2
          break
        }
        case 'neatRegular': {
          x = startX + (endX - startX) * t + (rand() - 0.5) * 1.5
          y = startY + (endY - startY) * t + (rand() - 0.5) * 1.5
          break
        }
        case 'cursiveScript': {
          x = startX + (endX - startX) * t + Math.sin(t * Math.PI * 2) * 8
          y = startY + (endY - startY) * t + Math.cos(t * Math.PI * 2) * 3
          break
        }
        case 'retroBrush': {
          x = startX + (endX - startX) * t + (rand() - 0.5) * 4
          y = startY + (endY - startY) * t + (rand() - 0.5) * 2
          break
        }
      }

      let pressure: number
      if (style === 'retroBrush') {
        pressure = 0.3 + Math.sin(t * Math.PI) * 0.7
      } else if (style === 'elegantRunning') {
        pressure = 0.5 + Math.sin(t * Math.PI) * 0.5
      } else if (style === 'cursiveScript') {
        pressure = 0.6 + (rand() - 0.3) * 0.4
      } else {
        pressure = 0.7 + (rand() - 0.5) * 0.3
      }

      stroke.push({ x, y, pressure })
    }

    strokes.push(stroke)
  }

  return strokes
}

export function generateHandwriting(
  text: string,
  style: HandwritingStyle,
  params: StyleParams
): GeneratedResult {
  const characters: CharacterPath[] = []
  let currentX = 0
  const lineHeight = 100
  const charSpacing = style === 'cursiveScript' ? -5 : style === 'elegantRunning' ? 2 : 8
  const maxWidth = 800

  for (let i = 0; i < text.length; i++) {
    const char = text[i]

    if (char === '\n') {
      currentX = 0
      continue
    }

    const cacheKey = `${char}_${style}_${params.strokeWidth}_${params.skewAngle}`

    let charPath: CharacterPath
    if (pathCache.has(cacheKey)) {
      charPath = { ...pathCache.get(cacheKey)! }
    } else {
      const strokes = generateStrokesForCharacter(char, style, params)
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity

      for (const stroke of strokes) {
        for (const pt of stroke) {
          minX = Math.min(minX, pt.x)
          minY = Math.min(minY, pt.y)
          maxX = Math.max(maxX, pt.x)
          maxY = Math.max(maxY, pt.y)
        }
      }

      charPath = {
        char,
        strokes,
        boundingBox: {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
        },
      }

      if (pathCache.size > 1000) {
        pathCache.clear()
      }
      pathCache.set(cacheKey, charPath)
    }

    const charWidth = charPath.boundingBox.width + charSpacing

    if (currentX + charWidth > maxWidth && currentX > 0) {
      currentX = 0
    }

    const offsetX = currentX - charPath.boundingBox.x
    const offsetY = 0 - charPath.boundingBox.y

    const positionedStrokes = charPath.strokes.map((stroke) =>
      stroke.map((pt) => {
        const centerX = pt.x + charPath.boundingBox.width / 2
        const centerY = pt.y + charPath.boundingBox.height / 2
        const angleRad = (params.skewAngle * Math.PI) / 180
        const skewedX = pt.x + (pt.y - centerY) * Math.tan(angleRad) * 0.3
        return {
          x: skewedX + offsetX,
          y: pt.y + offsetY,
          pressure: pt.pressure,
        }
      })
    )

    characters.push({
      char,
      strokes: positionedStrokes,
      boundingBox: {
        x: charPath.boundingBox.x + offsetX,
        y: charPath.boundingBox.y + offsetY,
        width: charPath.boundingBox.width,
        height: charPath.boundingBox.height,
      },
    })

    currentX += charWidth
  }

  let totalWidth = 0
  let totalHeight = lineHeight
  for (const char of characters) {
    totalWidth = Math.max(totalWidth, char.boundingBox.x + char.boundingBox.width)
    totalHeight = Math.max(totalHeight, char.boundingBox.y + char.boundingBox.height + 20)
  }

  return { characters, totalWidth, totalHeight }
}

export function strokesToSvgPath(strokes: StrokePoint[][]): string {
  const paths: string[] = []

  for (const stroke of strokes) {
    if (stroke.length < 2) continue

    let d = `M ${stroke[0].x.toFixed(2)} ${stroke[0].y.toFixed(2)}`

    for (let i = 1; i < stroke.length - 1; i++) {
      const xc = (stroke[i].x + stroke[i + 1].x) / 2
      const yc = (stroke[i].y + stroke[i + 1].y) / 2
      d += ` Q ${stroke[i].x.toFixed(2)} ${stroke[i].y.toFixed(2)} ${xc.toFixed(2)} ${yc.toFixed(2)}`
    }

    if (stroke.length >= 2) {
      const last = stroke[stroke.length - 1]
      d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`
    }

    paths.push(d)
  }

  return paths.join(' ')
}
