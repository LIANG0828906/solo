export interface Point {
  x: number
  y: number
}

export interface DoodleStroke {
  id: string
  points: Point[]
  color: string
  thickness: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
}

const JITTER_AMOUNT = 0.6
const TIP_LENGTH_RATIO = 0.25

const simplifyPoints = (points: Point[], tolerance: number = 0.3): Point[] => {
  if (points.length < 3) return points
  const result: Point[] = [points[0]]
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1]
    const curr = points[i]
    const dx = curr.x - prev.x
    const dy = curr.y - prev.y
    if (dx * dx + dy * dy > tolerance * tolerance) {
      result.push(curr)
    }
  }
  result.push(points[points.length - 1])
  return result
}

interface BezierSegment {
  x1: number
  y1: number
  x2: number
  y2: number
  x: number
  y: number
  thickness: number
}

const pointsToBezierSegments = (points: Point[], baseThickness: number): BezierSegment[] => {
  if (points.length < 2) return []
  const simplified = simplifyPoints(points, 0.3)
  if (simplified.length < 2) return []

  const segments: BezierSegment[] = []
  const totalLen = simplified.length
  const tipStartIdx = Math.max(0, totalLen - Math.floor(totalLen * TIP_LENGTH_RATIO))

  for (let i = 1; i < simplified.length; i++) {
    const p0 = simplified[i - 1]
    const p1 = simplified[i]

    let thickness = baseThickness
    if (i >= tipStartIdx) {
      const progress = (i - tipStartIdx) / Math.max(1, (totalLen - 1) - tipStartIdx)
      thickness = baseThickness * (1 - progress * 0.85)
    }
    if (i <= 3) {
      const startProgress = i / 3
      thickness = baseThickness * Math.min(1, startProgress * 1.2)
    }

    const jitter = JITTER_AMOUNT * (baseThickness / 8)
    const cp0x = p0.x + (Math.random() - 0.5) * jitter
    const cp0y = p0.y + (Math.random() - 0.5) * jitter
    const cp1x = p1.x + (Math.random() - 0.5) * jitter
    const cp1y = p1.y + (Math.random() - 0.5) * jitter

    segments.push({
      x1: cp0x,
      y1: cp0y,
      x2: cp1x,
      y2: cp1y,
      x: p1.x,
      y: p1.y,
      thickness: Math.max(0.5, thickness),
    })
  }

  return segments
}

const pointsToFullBezierPath = (points: Point[], baseThickness: number): string => {
  if (points.length < 2) return ''
  const simplified = simplifyPoints(points, 0.3)
  if (simplified.length < 2) return ''

  let d = `M ${simplified[0].x.toFixed(3)} ${simplified[0].y.toFixed(3)}`

  for (let i = 1; i < simplified.length; i++) {
    const p0 = simplified[i - 1]
    const p1 = simplified[i]

    const jitter = JITTER_AMOUNT * (baseThickness / 8)
    const cp1x = (p0.x + (Math.random() - 0.5) * jitter + p1.x + (Math.random() - 0.5) * jitter) / 2
    const cp1y = (p0.y + (Math.random() - 0.5) * jitter + p1.y + (Math.random() - 0.5) * jitter) / 2
    const cp2x = p1.x + (p1.x - p0.x) * 0.25 + (Math.random() - 0.5) * jitter * 0.5
    const cp2y = p1.y + (p1.y - p0.y) * 0.25 + (Math.random() - 0.5) * jitter * 0.5

    d += ` C ${cp1x.toFixed(3)} ${cp1y.toFixed(3)}, ${cp2x.toFixed(3)} ${cp2y.toFixed(3)}, ${p1.x.toFixed(3)} ${p1.y.toFixed(3)}`
  }

  return d
}

const drawStrokeWithBezier = (
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  color: string,
  baseThickness: number,
) => {
  const segments = pointsToBezierSegments(pts, baseThickness)
  if (segments.length === 0) return

  ctx.strokeStyle = color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  let startPt = pts[0]
  segments.forEach((seg, idx) => {
    ctx.lineWidth = seg.thickness
    ctx.beginPath()
    ctx.moveTo(startPt.x, startPt.y)
    ctx.bezierCurveTo(seg.x1, seg.y1, seg.x2, seg.y2, seg.x, seg.y)
    ctx.stroke()

    if (idx < segments.length - 1) {
      ctx.lineWidth = Math.max(0.3, seg.thickness * 0.85)
      ctx.beginPath()
      ctx.arc(seg.x, seg.y, seg.thickness * 0.45, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    }

    startPt = { x: seg.x, y: seg.y }
  })
}

export const canvasToPNG = (
  strokes: DoodleStroke[],
  _width: number,
  _height: number,
  bgColor: string = '#faf3e0'
): void => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  strokes.forEach(s => {
    const cx = s.x + s.width / 2
    const cy = s.y + s.height / 2
    const cos = Math.cos(s.rotation)
    const sin = Math.sin(s.rotation)
    const corners = [
      { x: s.x, y: s.y },
      { x: s.x + s.width * s.scaleX, y: s.y },
      { x: s.x + s.width * s.scaleX, y: s.y + s.height * s.scaleY },
      { x: s.x, y: s.y + s.height * s.scaleY },
    ].map(p => {
      const dx = p.x - cx
      const dy = p.y - cy
      return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
    })
    corners.forEach(p => {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    })
  })

  const padding = 60
  const exportW = Math.ceil(maxX - minX + padding * 2)
  const exportH = Math.ceil(maxY - minY + padding * 2)
  const offsetX = minX - padding
  const offsetY = minY - padding

  const canvas = document.createElement('canvas')
  canvas.width = exportW
  canvas.height = exportH
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, exportW, exportH)

  ctx.save()
  ctx.translate(-offsetX, -offsetY)

  strokes.forEach((stroke) => {
    if (stroke.points.length < 2) return
    ctx.save()
    const cx = stroke.x + stroke.width / 2
    const cy = stroke.y + stroke.height / 2
    ctx.translate(cx, cy)
    ctx.rotate(stroke.rotation)
    ctx.scale(stroke.scaleX, stroke.scaleY)
    ctx.translate(-stroke.width / 2, -stroke.height / 2)

    drawStrokeWithBezier(ctx, stroke.points, stroke.color, stroke.thickness)

    ctx.restore()
  })

  ctx.restore()

  const link = document.createElement('a')
  link.download = `doodle-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export const strokesToSVG = (
  strokes: DoodleStroke[],
  width: number,
  height: number,
  bgColor: string = '#faf3e0'
): string => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  strokes.forEach(s => {
    const cx = s.x + s.width / 2
    const cy = s.y + s.height / 2
    const cos = Math.cos(s.rotation)
    const sin = Math.sin(s.rotation)
    const corners = [
      { x: s.x, y: s.y },
      { x: s.x + s.width * s.scaleX, y: s.y },
      { x: s.x + s.width * s.scaleX, y: s.y + s.height * s.scaleY },
      { x: s.x, y: s.y + s.height * s.scaleY },
    ].map(p => {
      const dx = p.x - cx
      const dy = p.y - cy
      return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
    })
    corners.forEach(p => {
      if (p.x < minX) minX = p.x
      if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x
      if (p.y > maxY) maxY = p.y
    })
  })

  const padding = 60
  const exportW = strokes.length > 0 ? Math.ceil(maxX - minX + padding * 2) : width
  const exportH = strokes.length > 0 ? Math.ceil(maxY - minY + padding * 2) : height
  const offsetX = strokes.length > 0 ? minX - padding : 0
  const offsetY = strokes.length > 0 ? minY - padding : 0

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${exportW}" height="${exportH}" viewBox="0 0 ${exportW} ${exportH}">`
  svgContent += `<defs>\n`
  svgContent += `  <filter id="handDrawn" x="-10%" y="-10%" width="120%" height="120%">\n`
  svgContent += `    <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise"/>\n`
  svgContent += `    <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" xChannelSelector="R" yChannelSelector="G"/>\n`
  svgContent += `  </filter>\n`
  svgContent += `</defs>\n`
  svgContent += `<rect width="100%" height="100%" fill="${bgColor}"/>`

  svgContent += `<g transform="translate(${-offsetX}, ${-offsetY})">`

  strokes.forEach((stroke) => {
    if (stroke.points.length < 2) return
    const pathData = pointsToFullBezierPath(stroke.points, stroke.thickness)
    if (!pathData) return
    const cx = stroke.x + stroke.width / 2
    const cy = stroke.y + stroke.height / 2
    const transform = `translate(${cx},${cy}) rotate(${(stroke.rotation * 180) / Math.PI}) scale(${stroke.scaleX},${stroke.scaleY}) translate(${-stroke.width / 2},${-stroke.height / 2})`
    svgContent += `<path d="${pathData}" stroke="${stroke.color}" stroke-width="${stroke.thickness}" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="${transform}" filter="url(#handDrawn)"/>`
  })

  svgContent += `</g>`
  svgContent += '</svg>'
  return svgContent
}

export const canvasToSVG = (
  strokes: DoodleStroke[],
  width: number,
  height: number,
  bgColor: string = '#faf3e0'
): void => {
  const svgContent = strokesToSVG(strokes, width, height, bgColor)
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `doodle-${Date.now()}.svg`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}
