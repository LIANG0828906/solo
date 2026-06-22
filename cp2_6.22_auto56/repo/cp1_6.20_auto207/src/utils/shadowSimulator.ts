import type { Card, Point } from '../types'

export interface ShadowOptions {
  canvasWidth: number
  canvasHeight: number
  lightAngleDeg?: number
  shadowOffset?: number
  shadowColor?: { r: number; g: number; b: number; a: number }
  scale?: number
}

const DEFAULT_LIGHT_ANGLE = 135
const DEFAULT_SHADOW_OFFSET = 28
const DEFAULT_SHADOW_COLOR = { r: 10, g: 20, b: 60, a: 0.55 }

function snapToGrid(value: number, grid: number): number {
  return Math.round(value / grid) * grid
}

function getCorners(card: Card): Point[] {
  const rad = (card.rotation * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const hw = card.width / 2
  const hh = card.height / 2
  const corners: [number, number][] = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh],
  ]
  return corners.map(([cx, cy]) => ({
    x: card.x + cx * cos - cy * sin,
    y: card.y + cx * sin + cy * cos,
  }))
}

function offsetPolygon(points: Point[], dx: number, dy: number): Point[] {
  return points.map((p) => ({ x: p.x + dx, y: p.y + dy }))
}

function expandRect(corners: Point[]): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const p of corners) {
    if (p.x < minX) minX = p.x
    if (p.y < minY) minY = p.y
    if (p.x > maxX) maxX = p.x
    if (p.y > maxY) maxY = p.y
  }
  return { minX, minY, maxX, maxY }
}

function pointInPolygon(px: number, py: number, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y
    const xj = poly[j].x, yj = poly[j].y
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function computeShadows(
  cards: Card[],
  options: ShadowOptions,
): ImageData | null {
  const {
    canvasWidth,
    canvasHeight,
    lightAngleDeg = DEFAULT_LIGHT_ANGLE,
    shadowOffset = DEFAULT_SHADOW_OFFSET,
    shadowColor = DEFAULT_SHADOW_COLOR,
    scale = 1,
  } = options

  if (canvasWidth <= 0 || canvasHeight <= 0) return null

  const offscreen = document.createElement('canvas')
  offscreen.width = canvasWidth
  offscreen.height = canvasHeight
  const ctx = offscreen.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  const rad = ((lightAngleDeg - 180) * Math.PI) / 180
  const dx = Math.cos(rad) * shadowOffset * scale
  const dy = Math.sin(rad) * shadowOffset * scale

  const sortedCards = [...cards].sort((a, b) => a.zIndex - b.zIndex)

  for (let i = 0; i < sortedCards.length; i++) {
    const frontCard = sortedCards[i]
    const frontCorners = getCorners({
      ...frontCard,
      x: frontCard.x * scale,
      y: frontCard.y * scale,
      width: frontCard.width * scale,
      height: frontCard.height * scale,
    })
    const shadowPoly = offsetPolygon(frontCorners, dx, dy)

    const frontRect = expandRect(frontCorners)
    const shadowRect = expandRect(shadowPoly)
    const minX = Math.max(0, Math.floor(Math.min(frontRect.minX, shadowRect.minX)) - 2)
    const minY = Math.max(0, Math.floor(Math.min(frontRect.minY, shadowRect.minY)) - 2)
    const maxX = Math.min(canvasWidth, Math.ceil(Math.max(frontRect.maxX, shadowRect.maxX)) + 2)
    const maxY = Math.min(canvasHeight, Math.ceil(Math.max(frontRect.maxY, shadowRect.maxY)) + 2)
    if (minX >= maxX || minY >= maxY) continue

    const w = maxX - minX
    const h = maxY - minY
    const area = w * h
    if (area <= 0 || area > canvasWidth * canvasHeight) continue

    const buf = new Uint8ClampedArray(w * h)

    for (let py = 0; py < h; py++) {
      const y = minY + py
      for (let px = 0; px < w; px++) {
        const x = minX + px
        const inShadow = pointInPolygon(x + 0.5, y + 0.5, shadowPoly)
        if (!inShadow) continue
        const inFront = pointInPolygon(x + 0.5, y + 0.5, frontCorners)
        if (inFront) continue

        let behind = false
        for (let j = 0; j < i; j++) {
          const backCard = sortedCards[j]
          const bx = backCard.x * scale
          const by = backCard.y * scale
          const bw = backCard.width * scale
          const bh = backCard.height * scale
          const backCorners = getCorners({
            ...backCard,
            x: bx,
            y: by,
            width: bw,
            height: bh,
          })
          const bRect = expandRect(backCorners)
          if (x < bRect.minX || x > bRect.maxX || y < bRect.minY || y > bRect.maxY) continue
          if (pointInPolygon(x + 0.5, y + 0.5, backCorners)) {
            behind = true
            break
          }
        }
        if (!behind) continue
        buf[py * w + px] = Math.min(255, buf[py * w + px] + Math.round(255 * shadowColor.a))
      }
    }

    const imgData = ctx.createImageData(w, h)
    const data = imgData.data
    for (let idx = 0; idx < w * h; idx++) {
      const a = buf[idx]
      const o4 = idx * 4
      data[o4] = shadowColor.r
      data[o4 + 1] = shadowColor.g
      data[o4 + 2] = shadowColor.b
      data[o4 + 3] = a
    }
    ctx.putImageData(imgData, minX, minY)
  }

  ctx.globalCompositeOperation = 'source-over'
  for (const card of sortedCards) {
    const corners = getCorners({
      ...card,
      x: card.x * scale,
      y: card.y * scale,
      width: card.width * scale,
      height: card.height * scale,
    })
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(corners[0].x, corners[0].y)
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y)
    ctx.closePath()
    ctx.clip()
    const match = card.color.match(/rgba?\(([^)]+)\)/)
    let r = 120, g = 120, b = 200, a = 0.5
    if (match) {
      const parts = match[1].split(',').map((s) => parseFloat(s.trim()))
      r = parts[0] || r
      g = parts[1] || g
      b = parts[2] || b
      a = parts[3] != null ? parts[3] : a
    }
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a * card.opacity * 0.9})`
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    ctx.restore()
  }

  return ctx.getImageData(0, 0, canvasWidth, canvasHeight)
}

export { snapToGrid }
