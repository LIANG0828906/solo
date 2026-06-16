import type { Customization, StickerType } from '../types'
import { BASE_COLORS, STICKER_TYPES } from '../types'
import { v4 as uuidv4 } from 'uuid'

export class CarCustomizer {
  private customizations: Customization[] = []
  private currentId: string

  constructor() {
    const defaultCustom = this.createDefaultCustomization()
    this.customizations.push(defaultCustom)
    this.currentId = defaultCustom.id
  }

  private createDefaultCustomization(): Customization {
    return {
      id: uuidv4(),
      color: '#ffffff',
      sticker: 'none',
      unlocked: true,
    }
  }

  public getCurrent(): Customization {
    const current = this.customizations.find((c) => c.id === this.currentId)
    return current || this.customizations[0]
  }

  public setColor(color: string): void {
    const current = this.getCurrent()
    current.color = color
  }

  public setSticker(sticker: StickerType): void {
    const current = this.getCurrent()
    current.sticker = sticker
  }

  public getAvailableColors(): string[] {
    return BASE_COLORS
  }

  public getAvailableStickers(): StickerType[] {
    return STICKER_TYPES
  }

  public createNewCustomization(): Customization {
    const newCustom: Customization = {
      id: uuidv4(),
      color: '#ffffff',
      sticker: 'none',
      unlocked: true,
    }
    this.customizations.push(newCustom)
    this.currentId = newCustom.id
    return newCustom
  }

  public selectCustomization(id: string): boolean {
    const custom = this.customizations.find((c) => c.id === id)
    if (custom && custom.unlocked) {
      this.currentId = id
      return true
    }
    return false
  }

  public getAllCustomizations(): Customization[] {
    return [...this.customizations]
  }

  public deleteCustomization(id: string): boolean {
    if (id === this.currentId) return false
    const index = this.customizations.findIndex((c) => c.id === id)
    if (index === -1) return false
    this.customizations.splice(index, 1)
    return true
  }
}

export function drawCarOnCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color: string,
  sticker: StickerType,
  scale: number = 1
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.scale(scale, scale)

  const bodyWidth = 40
  const bodyHeight = 25
  const wheelWidth = 8
  const wheelHeight = 12

  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(-bodyWidth / 2 - 2, -bodyHeight / 2 - 2, wheelWidth, wheelHeight)
  ctx.fillRect(bodyWidth / 2 - wheelWidth + 2, -bodyHeight / 2 - 2, wheelWidth, wheelHeight)
  ctx.fillRect(-bodyWidth / 2 - 2, bodyHeight / 2 - wheelHeight + 2, wheelWidth, wheelHeight)
  ctx.fillRect(bodyWidth / 2 - wheelWidth + 2, bodyHeight / 2 - wheelHeight + 2, wheelWidth, wheelHeight)

  ctx.fillStyle = color
  ctx.beginPath()
  ctx.roundRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight, 6)
  ctx.fill()

  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.roundRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight, 6)
  ctx.stroke()

  const windshieldWidth = 20
  const windshieldHeight = 12
  ctx.fillStyle = 'rgba(100, 180, 255, 0.6)'
  ctx.fillRect(
    -windshieldWidth / 2 + 4,
    -windshieldHeight / 2,
    windshieldWidth,
    windshieldHeight
  )

  ctx.fillStyle = '#ef4444'
  ctx.beginPath()
  ctx.arc(-bodyWidth / 2 + 3, -bodyHeight / 4, 3, 0, Math.PI * 2)
  ctx.arc(-bodyWidth / 2 + 3, bodyHeight / 4, 3, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fef08a'
  ctx.beginPath()
  ctx.arc(bodyWidth / 2 - 3, -bodyHeight / 4, 3, 0, Math.PI * 2)
  ctx.arc(bodyWidth / 2 - 3, bodyHeight / 4, 3, 0, Math.PI * 2)
  ctx.fill()

  if (sticker !== 'none') {
    drawSticker(ctx, sticker, bodyWidth, bodyHeight)
  }

  ctx.restore()
}

function drawSticker(
  ctx: CanvasRenderingContext2D,
  sticker: StickerType,
  bodyWidth: number,
  bodyHeight: number
): void {
  ctx.save()
  ctx.translate(0, 0)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'

  switch (sticker) {
    case 'flame':
      drawFlameSticker(ctx, 0, 0, 18)
      break
    case 'lightning':
      drawLightningSticker(ctx, 0, 0, 20)
      break
    case 'skull':
      drawSkullSticker(ctx, 0, 0, 16)
      break
    case 'star':
      drawStarSticker(ctx, 0, 0, 14)
      break
    default:
      break
  }

  ctx.restore()
}

function drawFlameSticker(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save()
  ctx.translate(x, y)
  const gradient = ctx.createLinearGradient(0, size / 2, 0, -size / 2)
  gradient.addColorStop(0, '#f97316')
  gradient.addColorStop(0.5, '#eab308')
  gradient.addColorStop(1, '#ef4444')
  ctx.fillStyle = gradient

  ctx.beginPath()
  ctx.moveTo(0, -size / 2)
  ctx.quadraticCurveTo(size / 3, -size / 4, size / 4, size / 4)
  ctx.quadraticCurveTo(size / 6, size / 6, 0, size / 2)
  ctx.quadraticCurveTo(-size / 6, size / 6, -size / 4, size / 4)
  ctx.quadraticCurveTo(-size / 3, -size / 4, 0, -size / 2)
  ctx.fill()
  ctx.restore()
}

function drawLightningSticker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#facc15'
  ctx.strokeStyle = '#78350f'
  ctx.lineWidth = 1.5

  ctx.beginPath()
  ctx.moveTo(-size / 6, -size / 2)
  ctx.lineTo(size / 6, -size / 6)
  ctx.lineTo(0, 0)
  ctx.lineTo(size / 4, size / 2)
  ctx.lineTo(-size / 12, size / 8)
  ctx.lineTo(0, 0)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

function drawSkullSticker(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#f5f5f5'
  ctx.strokeStyle = '#171717'
  ctx.lineWidth = 1.5

  ctx.beginPath()
  ctx.arc(0, -size / 6, size / 2.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(-size / 4, size / 6)
  ctx.lineTo(size / 4, size / 6)
  ctx.lineTo(size / 5, size / 2)
  ctx.lineTo(size / 10, size / 3)
  ctx.lineTo(0, size / 2)
  ctx.lineTo(-size / 10, size / 3)
  ctx.lineTo(-size / 5, size / 2)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = '#171717'
  ctx.beginPath()
  ctx.arc(-size / 7, -size / 5, size / 10, 0, Math.PI * 2)
  ctx.arc(size / 7, -size / 5, size / 10, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(0, -size / 8)
  ctx.lineTo(-size / 14, size / 12)
  ctx.lineTo(size / 14, size / 12)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawStarSticker(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = '#fbbf24'
  ctx.strokeStyle = '#92400e'
  ctx.lineWidth = 1.5

  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const outerX = Math.cos(angle) * size / 2
    const outerY = Math.sin(angle) * size / 2
    const innerAngle = angle + (2 * Math.PI) / 10
    const innerX = Math.cos(innerAngle) * size / 4.5
    const innerY = Math.sin(innerAngle) * size / 4.5

    if (i === 0) {
      ctx.moveTo(outerX, outerY)
    } else {
      ctx.lineTo(outerX, outerY)
    }
    ctx.lineTo(innerX, innerY)
  }
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}
