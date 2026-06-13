export const PIE_COLORS = [
  '#e74c3c',
  '#f39c12',
  '#f1c40f',
  '#2ecc71',
  '#3498db',
  '#9b59b6',
  '#e91e63'
]

export interface PieDataItem {
  category: string
  amount: number
  percentage: number
}

export interface PieSlice {
  startAngle: number
  endAngle: number
  color: string
  category: string
  amount: number
  percentage: number
  centerX: number
  centerY: number
  radius: number
  offset: number
}

export interface LineDataItem {
  month: string
  expense: number
  income: number
}

export interface LinePoint {
  x: number
  y: number
  month: string
  expense: number
}

export function drawPieChart(
  canvas: HTMLCanvasElement,
  data: PieDataItem[],
  hoverIndex?: number
): PieSlice[] {
  const ctx = canvas.getContext('2d')
  if (!ctx) return []

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const width = rect.width
  const height = rect.height
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) * 0.4
  const hoverOffset = 15

  ctx.clearRect(0, 0, width, height)

  const slices: PieSlice[] = []
  let startAngle = -Math.PI / 2

  data.forEach((item, index) => {
    const sliceAngle = (item.percentage / 100) * Math.PI * 2
    const endAngle = startAngle + sliceAngle
    const isHovered = hoverIndex === index
    const offset = isHovered ? hoverOffset : 0

    const midAngle = startAngle + sliceAngle / 2
    const offsetX = Math.cos(midAngle) * offset
    const offsetY = Math.sin(midAngle) * offset

    const color = PIE_COLORS[index % PIE_COLORS.length]

    ctx.beginPath()
    ctx.moveTo(centerX + offsetX, centerY + offsetY)
    ctx.arc(
      centerX + offsetX,
      centerY + offsetY,
      radius,
      startAngle,
      endAngle
    )
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()

    slices.push({
      startAngle,
      endAngle,
      color,
      category: item.category,
      amount: item.amount,
      percentage: item.percentage,
      centerX,
      centerY,
      radius,
      offset
    })

    startAngle = endAngle
  })

  return slices
}

export function drawLineChart(
  canvas: HTMLCanvasElement,
  data: LineDataItem[],
  hoverMonth?: string
): LinePoint[] {
  const ctx = canvas.getContext('2d')
  if (!ctx || data.length === 0) return []

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)

  const width = rect.width
  const height = rect.height
  const padding = { top: 30, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  ctx.clearRect(0, 0, width, height)

  const expenses = data.map(d => d.expense)
  const maxValue = Math.max(...expenses) * 1.1
  const minValue = 0

  const xStep = chartWidth / (data.length - 1 || 1)

  const points: LinePoint[] = data.map((item, index) => {
    const x = padding.left + index * xStep
    const y = padding.top + chartHeight - ((item.expense - minValue) / (maxValue - minValue)) * chartHeight
    return { x, y, month: item.month, expense: item.expense }
  })

  const yTickCount = 5
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 1
  ctx.fillStyle = '#999'
  ctx.font = '12px Arial'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'

  for (let i = 0; i <= yTickCount; i++) {
    const y = padding.top + (chartHeight / yTickCount) * i
    const value = maxValue - ((maxValue - minValue) / yTickCount) * i

    ctx.beginPath()
    ctx.moveTo(padding.left, y)
    ctx.lineTo(width - padding.right, y)
    ctx.stroke()

    ctx.fillText(value.toFixed(0), padding.left - 8, y)
  }

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  points.forEach(point => {
    ctx.fillText(point.month, point.x, height - padding.bottom + 10)
  })

  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, height - padding.bottom)
  ctx.lineTo(width - padding.right, height - padding.bottom)
  ctx.stroke()

  const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
  gradient.addColorStop(0, 'rgba(52, 152, 219, 0.3)')
  gradient.addColorStop(1, 'rgba(52, 152, 219, 0)')

  ctx.beginPath()
  ctx.moveTo(points[0].x, height - padding.bottom)
  points.forEach(point => {
    ctx.lineTo(point.x, point.y)
  })
  ctx.lineTo(points[points.length - 1].x, height - padding.bottom)
  ctx.closePath()
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.beginPath()
  ctx.strokeStyle = '#3498db'
  ctx.lineWidth = 2
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  points.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y)
    } else {
      ctx.lineTo(point.x, point.y)
    }
  })
  ctx.stroke()

  points.forEach(point => {
    const isHovered = hoverMonth === point.month
    ctx.beginPath()
    ctx.arc(point.x, point.y, isHovered ? 6 : 4, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = '#3498db'
    ctx.lineWidth = 2
    ctx.stroke()
  })

  return points
}

export function animateNumber(
  start: number,
  end: number,
  duration: number,
  callback: (value: number) => void
): void {
  const startTime = performance.now()

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    const easeProgress = 1 - Math.pow(1 - progress, 3)
    const currentValue = start + (end - start) * easeProgress

    callback(currentValue)

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}
