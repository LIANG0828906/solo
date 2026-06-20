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

const simplifyPoints = (points: Point[], tolerance: number = 0.5): Point[] => {
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

const pointsToBezierPath = (points: Point[]): string => {
  if (points.length < 2) return ''
  const simplified = simplifyPoints(points, 0.3)
  if (simplified.length < 2) return ''

  let d = `M ${simplified[0].x.toFixed(2)} ${simplified[0].y.toFixed(2)}`

  for (let i = 1; i < simplified.length - 1; i++) {
    const p0 = simplified[i - 1]
    const p1 = simplified[i]
    const p2 = simplified[i + 1]
    const cp1x = p0.x + (p1.x - p0.x) * 0.5
    const cp1y = p0.y + (p1.y - p0.y) * 0.5
    const cp2x = p1.x + (p2.x - p1.x) * 0.5
    const cp2y = p1.y + (p2.y - p1.y) * 0.5
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`
  }

  if (simplified.length >= 2) {
    const last = simplified[simplified.length - 1]
    d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`
  }

  return d
}

export const canvasToPNG = (
  strokes: DoodleStroke[],
  width: number,
  height: number,
  bgColor: string = '#faf3e0'
): void => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, width, height)

  strokes.forEach((stroke) => {
    if (stroke.points.length < 2) return
    ctx.save()
    ctx.translate(stroke.x + stroke.width / 2, stroke.y + stroke.height / 2)
    ctx.rotate(stroke.rotation)
    ctx.scale(stroke.scaleX, stroke.scaleY)
    ctx.translate(-stroke.width / 2, -stroke.height / 2)
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.thickness
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const pts = stroke.points
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y)
    }
    ctx.stroke()
    ctx.restore()
  })

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
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  svgContent += `<rect width="100%" height="100%" fill="${bgColor}"/>`

  strokes.forEach((stroke) => {
    if (stroke.points.length < 2) return
    const pathData = pointsToBezierPath(stroke.points)
    if (!pathData) return
    const cx = stroke.x + stroke.width / 2
    const cy = stroke.y + stroke.height / 2
    const transform = `translate(${cx},${cy}) rotate(${(stroke.rotation * 180) / Math.PI}) scale(${stroke.scaleX},${stroke.scaleY}) translate(${-stroke.width / 2},${-stroke.height / 2})`
    svgContent += `<path d="${pathData}" stroke="${stroke.color}" stroke-width="${stroke.thickness}" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="${transform}"/>`
  })

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
