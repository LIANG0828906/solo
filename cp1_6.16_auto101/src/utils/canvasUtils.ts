import type { BrushType } from '../types'

export const PRESET_COLORS = [
  '#FF4500',
  '#FF8C00',
  '#1E90FF',
  '#32CD32',
  '#8A2BE2'
]

export function getBrushSettings(type: BrushType): {
  lineWidth: number
  lineCap: CanvasLineCap
  lineJoin: CanvasLineJoin
  globalAlpha: number
  isWatercolor?: boolean
  isSquare?: boolean
} {
  switch (type) {
    case 'ballpoint':
      return {
        lineWidth: 2,
        lineCap: 'round',
        lineJoin: 'round',
        globalAlpha: 1
      }
    case 'watercolor':
      return {
        lineWidth: 5,
        lineCap: 'round',
        lineJoin: 'round',
        globalAlpha: 0.4,
        isWatercolor: true
      }
    case 'marker':
      return {
        lineWidth: 8,
        lineCap: 'square',
        lineJoin: 'miter',
        globalAlpha: 1,
        isSquare: true
      }
  }
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize: number = 20,
  color: string = '#E0E0E0'
): void {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 0.5
  ctx.setLineDash([3, 3])
  
  for (let x = gridSize; x < width; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  
  for (let y = gridSize; y < height; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  
  ctx.restore()
}

export function drawDriftRoute(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  nodes: { city: string; date: string }[]
): void {
  ctx.clearRect(0, 0, width, height)
  
  const padding = { top: 40, right: 40, bottom: 50, left: 40 }
  const innerWidth = width - padding.left - padding.right
  const innerHeight = height - padding.top - padding.bottom
  
  const nodeCount = nodes.length
  if (nodeCount === 0) return
  
  const positions: { x: number; y: number }[] = []
  
  for (let i = 0; i < nodeCount; i++) {
    const x = padding.left + (innerWidth / (nodeCount - 1 || 1)) * i
    const y = padding.top + innerHeight / 2 + Math.sin(i * 1.2) * (innerHeight * 0.25)
    positions.push({ x, y })
  }
  
  ctx.strokeStyle = '#f97316'
  ctx.lineWidth = 2
  ctx.setLineDash([6, 4])
  ctx.lineDashOffset = 0
  
  ctx.beginPath()
  ctx.moveTo(positions[0].x, positions[0].y)
  
  for (let i = 1; i < positions.length; i++) {
    const prev = positions[i - 1]
    const curr = positions[i]
    const cpx = (prev.x + curr.x) / 2
    const cpy = (prev.y + curr.y) / 2 + (i % 2 === 0 ? -30 : 30)
    ctx.quadraticCurveTo(cpx, cpy, curr.x, curr.y)
  }
  ctx.stroke()
  ctx.setLineDash([])
  
  nodes.forEach((node, i) => {
    const pos = positions[i]
    
    const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 14)
    gradient.addColorStop(0, '#fff')
    gradient.addColorStop(0.6, '#f97316')
    gradient.addColorStop(1, '#ea580c')
    
    ctx.beginPath()
    ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.stroke()
    
    ctx.fillStyle = '#374151'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(node.city, pos.x, pos.y - 18)
    
    ctx.fillStyle = '#6b7280'
    ctx.font = '11px sans-serif'
    ctx.textBaseline = 'top'
    ctx.fillText(node.date, pos.x, pos.y + 18)
  })
}

export function drawBrushPreview(
  ctx: CanvasRenderingContext2D,
  type: BrushType,
  color: string,
  x: number,
  y: number
): void {
  const settings = getBrushSettings(type)
  
  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = settings.lineWidth
  ctx.lineCap = settings.lineCap
  ctx.globalAlpha = settings.globalAlpha
  
  if (type === 'marker') {
    ctx.fillRect(x - 8, y - 4, 16, 8)
  } else if (type === 'watercolor') {
    ctx.beginPath()
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fill()
  }
  
  ctx.restore()
}
