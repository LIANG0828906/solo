import type { BackgroundTexture, StyleParams } from '../store/appStore'
import type { CharacterPath, GeneratedResult, StrokePoint } from './handwritingGenerator'

export interface CanvasTransform {
  scale: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}

export interface RenderOptions {
  canvas: HTMLCanvasElement
  result: GeneratedResult
  styleParams: StyleParams
  background: { texture: BackgroundTexture; opacity: number }
  animationProgress?: number
  showGrid?: boolean
  isComparison?: boolean
  systemFont?: string
  text?: string
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  texture: BackgroundTexture,
  opacity: number
) {
  ctx.save()
  ctx.globalAlpha = opacity

  switch (texture) {
    case 'kraftPaper': {
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#d4b896')
      gradient.addColorStop(0.5, '#c9a876')
      gradient.addColorStop(1, '#b8956a')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      for (let i = 0; i < 800; i++) {
        ctx.fillStyle = `rgba(${100 + Math.random() * 40}, ${70 + Math.random() * 30}, ${40 + Math.random() * 20}, ${Math.random() * 0.08})`
        ctx.fillRect(Math.random() * width, Math.random() * height, 1 + Math.random() * 2, 1 + Math.random() * 2)
      }
      break
    }
    case 'chalkboard': {
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 2)
      gradient.addColorStop(0, '#2d5a3d')
      gradient.addColorStop(1, '#1a3a28')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.03})`
        ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1)
      }
      break
    }
    case 'ricePaper': {
      ctx.fillStyle = '#f8f4e8'
      ctx.fillRect(0, 0, width, height)
      for (let i = 0; i < 400; i++) {
        ctx.fillStyle = `rgba(180, 160, 120, ${Math.random() * 0.06})`
        ctx.beginPath()
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
      for (let i = 0; i < 10; i++) {
        ctx.fillStyle = `rgba(150, 130, 100, ${Math.random() * 0.03})`
        ctx.beginPath()
        ctx.ellipse(
          Math.random() * width,
          Math.random() * height,
          20 + Math.random() * 40,
          20 + Math.random() * 40,
          Math.random() * Math.PI,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }
      break
    }
    case 'linen': {
      ctx.fillStyle = '#e8e0d0'
      ctx.fillRect(0, 0, width, height)
      ctx.strokeStyle = 'rgba(150, 140, 120, 0.15)'
      ctx.lineWidth = 1
      for (let x = 0; x < width; x += 4) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }
      for (let y = 0; y < height; y += 4) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
      break
    }
    case 'frostedGlass': {
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)')
      gradient.addColorStop(1, 'rgba(230, 230, 240, 0.5)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      for (let i = 0; i < 500; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`
        ctx.beginPath()
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      break
    }
    case 'gradient': {
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#f4ecd8')
      gradient.addColorStop(0.5, '#e8dcc0')
      gradient.addColorStop(1, '#d4c4a8')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
      break
    }
  }

  ctx.restore()
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.save()
  ctx.fillStyle = 'rgba(139, 115, 85, 0.15)'
  for (let x = 0; x < width; x += 20) {
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath()
      ctx.arc(x, y, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: StrokePoint[],
  params: StyleParams,
  progress: number
) {
  if (stroke.length < 2) return

  const totalPoints = Math.floor(stroke.length * progress)
  if (totalPoints < 2) return

  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let i = 1; i < totalPoints; i++) {
    const prev = stroke[i - 1]
    const curr = stroke[i]
    const pressure = prev.pressure
    const width = params.strokeWidth * (0.5 + pressure * 0.5)

    ctx.beginPath()
    ctx.strokeStyle = `rgba(40, 30, 20, ${params.inkDensity})`
    ctx.lineWidth = width
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(curr.x, curr.y)
    ctx.stroke()
  }

  ctx.restore()
}

function drawHandwriting(
  ctx: CanvasRenderingContext2D,
  characters: CharacterPath[],
  params: StyleParams,
  animationProgress: number
) {
  const totalChars = characters.length
  if (totalChars === 0) return

  const progressPerChar = 1 / totalChars

  for (let i = 0; i < totalChars; i++) {
    const charStart = i * progressPerChar
    const charEnd = (i + 1) * progressPerChar

    if (animationProgress < charStart) break

    const charProgress = Math.min(1, (animationProgress - charStart) / progressPerChar)
    const char = characters[i]

    for (const stroke of char.strokes) {
      drawStroke(ctx, stroke, params, charProgress)
    }
  }
}

function drawSystemFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  font: string,
  width: number,
  height: number
) {
  ctx.save()
  ctx.font = `48px ${font}`
  ctx.fillStyle = '#2a2018'
  ctx.textBaseline = 'top'

  const padding = 40
  const lineHeight = 70
  let x = padding
  let y = padding

  for (const char of text) {
    if (char === '\n') {
      x = padding
      y += lineHeight
      continue
    }

    const metrics = ctx.measureText(char)
    if (x + metrics.width > width - padding && x > padding) {
      x = padding
      y += lineHeight
    }

    ctx.fillText(char, x, y)
    x += metrics.width + 4
  }

  ctx.restore()
}

export function getCanvasTransform(
  canvasWidth: number,
  canvasHeight: number,
  result: GeneratedResult
): CanvasTransform {
  const width = canvasWidth
  const height = canvasHeight
  const scaleX = (width - 80) / Math.max(result.totalWidth, 1)
  const scaleY = (height - 80) / Math.max(result.totalHeight, 1)
  const scale = Math.min(scaleX, scaleY, 1.5)
  const offsetX = (width - result.totalWidth * scale) / 2
  const offsetY = (height - result.totalHeight * scale) / 2
  return { scale, offsetX, offsetY, width, height }
}

export function screenToCanvas(
  screenX: number,
  screenY: number,
  transform: CanvasTransform
): { x: number; y: number } {
  return {
    x: (screenX - transform.offsetX) / transform.scale,
    y: (screenY - transform.offsetY) / transform.scale,
  }
}

export function getCharacterScreenRect(
  character: CharacterPath,
  transform: CanvasTransform,
  padding: number = 6
): { x: number; y: number; width: number; height: number } {
  const bx = character.boundingBox.x
  const by = character.boundingBox.y
  const bw = character.boundingBox.width
  const bh = character.boundingBox.height

  return {
    x: bx * transform.scale + transform.offsetX - padding,
    y: by * transform.scale + transform.offsetY - padding,
    width: bw * transform.scale + padding * 2,
    height: bh * transform.scale + padding * 2,
  }
}

export function findCharacterAtPoint(
  x: number,
  y: number,
  result: GeneratedResult,
  transform: CanvasTransform
): { index: number; character: CharacterPath } | null {
  const canvasPoint = screenToCanvas(x, y, transform)
  const hitPadding = 10

  for (let i = 0; i < result.characters.length; i++) {
    const char = result.characters[i]
    const bx = char.boundingBox.x
    const by = char.boundingBox.y
    const bw = char.boundingBox.width
    const bh = char.boundingBox.height

    if (
      canvasPoint.x >= bx - hitPadding &&
      canvasPoint.x <= bx + bw + hitPadding &&
      canvasPoint.y >= by - hitPadding &&
      canvasPoint.y <= by + bh + hitPadding
    ) {
      return { index: i, character: char }
    }
  }

  return null
}

export function drawCharacterHighlight(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number }
) {
  ctx.save()
  ctx.fillStyle = 'rgba(255, 235, 130, 0.3)'
  ctx.strokeStyle = 'rgba(200, 170, 50, 0.6)'
  ctx.lineWidth = 2

  const radius = 6
  const { x, y, width, height } = rect

  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()

  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

export function renderCanvas(options: RenderOptions) {
  const { canvas, result, styleParams, background, animationProgress = 1, showGrid = true, isComparison = false, systemFont, text } = options

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const width = canvas.width
  const height = canvas.height

  ctx.clearRect(0, 0, width, height)

  drawBackground(ctx, width, height, background.texture, background.opacity)

  if (showGrid) {
    drawGrid(ctx, width, height)
  }

  ctx.save()
  const scaleX = (width - 80) / Math.max(result.totalWidth, 1)
  const scaleY = (height - 80) / Math.max(result.totalHeight, 1)
  const scale = Math.min(scaleX, scaleY, 1.5)
  const offsetX = (width - result.totalWidth * scale) / 2
  const offsetY = (height - result.totalHeight * scale) / 2
  ctx.translate(offsetX, offsetY)
  ctx.scale(scale, scale)

  if (isComparison && systemFont && text) {
    ctx.restore()
    drawSystemFont(ctx, text, systemFont, width, height)
  } else {
    drawHandwriting(ctx, result.characters, styleParams, animationProgress)
    ctx.restore()
  }
}

export function drawMagnifier(
  sourceCanvas: HTMLCanvasElement,
  targetCtx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number = 60,
  zoom: number = 2
) {
  const sourceCtx = sourceCanvas.getContext('2d')
  if (!sourceCtx) return

  const sourceWidth = sourceCanvas.width
  const sourceHeight = sourceCanvas.height

  const sourceX = Math.max(0, Math.min(sourceWidth - (radius / zoom) * 2, centerX - radius / zoom))
  const sourceY = Math.max(0, Math.min(sourceHeight - (radius / zoom) * 2, centerY - radius / zoom))

  targetCtx.save()
  targetCtx.beginPath()
  targetCtx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  targetCtx.closePath()
  targetCtx.clip()

  const imageData = sourceCtx.getImageData(sourceX, sourceY, (radius / zoom) * 2, (radius / zoom) * 2)
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = (radius / zoom) * 2
  tempCanvas.height = (radius / zoom) * 2
  const tempCtx = tempCanvas.getContext('2d')
  if (tempCtx) {
    tempCtx.putImageData(imageData, 0, 0)
    targetCtx.drawImage(tempCanvas, centerX - radius, centerY - radius, radius * 2, radius * 2)
  }

  targetCtx.restore()

  targetCtx.save()
  targetCtx.beginPath()
  targetCtx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  targetCtx.strokeStyle = '#8b7355'
  targetCtx.lineWidth = 2
  targetCtx.stroke()

  const crossSize = 10
  targetCtx.beginPath()
  targetCtx.moveTo(centerX - crossSize, centerY)
  targetCtx.lineTo(centerX + crossSize, centerY)
  targetCtx.moveTo(centerX, centerY - crossSize)
  targetCtx.lineTo(centerX, centerY + crossSize)
  targetCtx.strokeStyle = 'rgba(139, 115, 85, 0.5)'
  targetCtx.lineWidth = 1
  targetCtx.stroke()
  targetCtx.restore()
}
