export interface ParticleTarget {
  x: number
  y: number
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function easeOutElastic(t: number): number {
  const c4 = (2 * Math.PI) / 3
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
}

export function easeOutBack(t: number): number {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

export function morphParticles(
  fromPositions: Float32Array,
  toTargets: ParticleTarget[],
  progress: number,
  scatterAmount: number = 150
): Float32Array {
  const result = new Float32Array(fromPositions.length)
  const particleCount = fromPositions.length / 3

  for (let i = 0; i < particleCount; i++) {
    const idx = i * 3
    const fromX = fromPositions[idx]
    const fromY = fromPositions[idx + 1]

    const targetIndex = i % toTargets.length
    const toX = toTargets[targetIndex].x
    const toY = toTargets[targetIndex].y

    if (progress < 0.5) {
      const t = progress * 2
      const scatterT = easeInOutCubic(t)
      
      const angle = (i * 137.5 * Math.PI) / 180
      const dist = scatterAmount * scatterT * (0.5 + Math.random() * 0.5)
      
      result[idx] = fromX + Math.cos(angle) * dist * (1 + Math.sin(i * 0.3) * 0.3)
      result[idx + 1] = fromY + Math.sin(angle) * dist * (1 + Math.cos(i * 0.4) * 0.3)
    } else {
      const t = (progress - 0.5) * 2
      const gatherT = easeOutBack(t)

      const angle = (i * 137.5 * Math.PI) / 180
      const dist = scatterAmount * (1 - gatherT)

      result[idx] = toX + Math.cos(angle) * dist
      result[idx + 1] = toY + Math.sin(angle) * dist
    }

    result[idx + 2] = 0
  }

  return result
}

export function generateDigitPoints(
  digit: string,
  count: number,
  width: number,
  height: number
): { x: number; y: number }[] {
  const canvas = document.createElement('canvas')
  canvas.width = width * 2
  canvas.height = height * 2
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${height * 1.6}px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(digit, width, height)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const points: { x: number; y: number }[] = []

  for (let attempt = 0; attempt < count * 20 && points.length < count; attempt++) {
    const x = Math.floor(Math.random() * canvas.width)
    const y = Math.floor(Math.random() * canvas.height)
    const idx = (y * canvas.width + x) * 4

    if (imageData.data[idx + 3] > 128) {
      points.push({
        x: (x - width) / 2,
        y: -(y - height) / 2
      })
    }
  }

  while (points.length < count) {
    const randomIndex = Math.floor(Math.random() * points.length)
    const basePoint = points[randomIndex]
    points.push({
      x: basePoint.x + (Math.random() - 0.5) * 4,
      y: basePoint.y + (Math.random() - 0.5) * 4
    })
  }

  return points.slice(0, count)
}

export function generateTimePoints(
  hours: number,
  minutes: number,
  seconds: number,
  particlesPerDigit: number,
  digitWidth: number,
  digitHeight: number,
  spacing: number
): { x: number; y: number }[] {
  const allPoints: { x: number; y: number }[] = []

  const h1 = Math.floor(hours / 10)
  const h2 = hours % 10
  const m1 = Math.floor(minutes / 10)
  const m2 = minutes % 10
  const s1 = Math.floor(seconds / 10)
  const s2 = seconds % 10

  const digits = [h1, h2, ':', m1, m2, ':', s1, s2]
  
  let offsetX = -((digits.length * digitWidth + (digits.length - 1) * spacing) / 2) + digitWidth / 2

  for (const digit of digits) {
    const digitStr = String(digit)
    const points = digitStr === ':' 
      ? generateColonPoints(particlesPerDigit / 3, digitHeight)
      : generateDigitPoints(digitStr, particlesPerDigit, digitWidth, digitHeight)
    
    for (const point of points) {
      allPoints.push({
        x: point.x + offsetX,
        y: point.y
      })
    }

    offsetX += digitWidth + spacing
  }

  return allPoints
}

function generateColonPoints(count: number, height: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = []
  const dotRadius = 4

  for (let i = 0; i < count; i++) {
    const topDot = i < count / 2
    const angle = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random()) * dotRadius
    
    points.push({
      x: Math.cos(angle) * r,
      y: (topDot ? 1 : -1) * (height * 0.2) + Math.sin(angle) * r
    })
  }

  return points
}
