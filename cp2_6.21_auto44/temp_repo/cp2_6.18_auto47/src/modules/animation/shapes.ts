export type ShapeType = 'circle' | 'rect' | 'star'

export interface ShapeProps {
  x: number
  y: number
  size: number
  opacity: number
  rotation: number
  color: string
  cornerRadius?: number
  shadowBlur?: number
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  type: ShapeType,
  props: ShapeProps
): void {
  const { x, y, size, opacity, rotation, color, cornerRadius = 8, shadowBlur = 10 } = props

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.translate(x, y)
  ctx.rotate((rotation * Math.PI) / 180)

  ctx.shadowColor = color
  ctx.shadowBlur = shadowBlur

  ctx.fillStyle = color

  switch (type) {
    case 'circle':
      drawCircle(ctx, size)
      break
    case 'rect':
      drawRect(ctx, size, cornerRadius)
      break
    case 'star':
      drawStar(ctx, size)
      break
  }

  ctx.restore()
}

function drawCircle(ctx: CanvasRenderingContext2D, size: number): void {
  const radius = size / 2
  ctx.beginPath()
  ctx.arc(0, 0, radius, 0, Math.PI * 2)
  ctx.fill()
}

function drawRect(ctx: CanvasRenderingContext2D, size: number, cornerRadius: number): void {
  const half = size / 2
  const r = Math.min(cornerRadius, half)
  ctx.beginPath()
  ctx.moveTo(-half + r, -half)
  ctx.lineTo(half - r, -half)
  ctx.quadraticCurveTo(half, -half, half, -half + r)
  ctx.lineTo(half, half - r)
  ctx.quadraticCurveTo(half, half, half - r, half)
  ctx.lineTo(-half + r, half)
  ctx.quadraticCurveTo(-half, half, -half, half - r)
  ctx.lineTo(-half, -half + r)
  ctx.quadraticCurveTo(-half, -half, -half + r, -half)
  ctx.closePath()
  ctx.fill()
}

function drawStar(ctx: CanvasRenderingContext2D, size: number): void {
  const outerRadius = size / 2
  const innerRadius = outerRadius * 0.4
  const spikes = 5

  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / spikes - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.closePath()
  ctx.fill()
}

export function elasticEaseOut(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.3
  const s = p / 4
  return Math.pow(2, -10 * t) * Math.sin((t - s) * (2 * Math.PI) / p) + 1
}
