import { useEffect, useRef } from 'react'
import { useFoodStore } from '../store/foodStore'

export default function WeeklyChart() {
  const { getWeeklyData } = useFoodStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const data = getWeeklyData()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const W = rect.width
    const H = rect.height
    const padding = { top: 20, right: 16, bottom: 32, left: 44 }
    const chartW = W - padding.left - padding.right
    const chartH = H - padding.top - padding.bottom

    ctx.clearRect(0, 0, W, H)

    const calories = data.map((d) => d.calories)
    const targetVal = data.length > 0 ? data[0].target : 2000
    const maxCal = Math.max(targetVal * 1.2, ...calories, 100)

    const stepCount = 4
    const yStep = Math.ceil(maxCal / stepCount / 100) * 100
    const yMax = yStep * stepCount

    ctx.strokeStyle = '#E8E5D9'
    ctx.lineWidth = 1
    ctx.font = '11px Noto Sans SC, sans-serif'
    ctx.fillStyle = '#9E9E9E'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    for (let i = 0; i <= stepCount; i++) {
      const y = padding.top + chartH - (i / stepCount) * chartH
      const val = (yStep * i).toString()

      ctx.beginPath()
      ctx.setLineDash([3, 3])
      ctx.moveTo(padding.left, y)
      ctx.lineTo(W - padding.right, y)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillText(val, padding.left - 8, y)
    }

    const targetRatio = targetVal / yMax
    const targetY = padding.top + chartH - targetRatio * chartH
    ctx.strokeStyle = '#4CAF50'
    ctx.lineWidth = 1.5
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(padding.left, targetY)
    ctx.lineTo(W - padding.right, targetY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.textAlign = 'left'
    ctx.fillStyle = '#4CAF50'
    ctx.font = '10px Noto Sans SC, sans-serif'
    ctx.fillText(`目标 ${targetVal}`, padding.left + 4, targetY - 8)

    const xGap = data.length > 1 ? chartW / (data.length - 1) : 0

    const points = data.map((d, i) => {
      const x = padding.left + i * xGap
      const ratio = Math.min(d.calories / yMax, 1)
      const y = padding.top + chartH - ratio * chartH
      return { x, y, ...d }
    })

    const lineGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH)
    lineGradient.addColorStop(0, '#FF8C00')
    lineGradient.addColorStop(1, '#FFB74D')

    ctx.strokeStyle = lineGradient
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.beginPath()
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    if (points.length >= 2) {
      const areaGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH)
      areaGradient.addColorStop(0, 'rgba(255, 140, 0, 0.18)')
      areaGradient.addColorStop(1, 'rgba(255, 140, 0, 0.02)')

      ctx.fillStyle = areaGradient
      ctx.beginPath()
      ctx.moveTo(points[0].x, padding.top + chartH)
      points.forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.lineTo(points[points.length - 1].x, padding.top + chartH)
      ctx.closePath()
      ctx.fill()
    }

    points.forEach((p) => {
      const reached = p.calories >= p.target
      const color = reached ? '#4CAF50' : '#F44336'

      ctx.beginPath()
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2)
      ctx.fillStyle = 'white'
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = color
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
    })

    ctx.fillStyle = '#616161'
    ctx.font = '11px Noto Sans SC, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    points.forEach((p) => {
      ctx.fillText(p.date, p.x, padding.top + chartH + 10)
    })
  }, [data])

  return (
    <div className="card chart-card">
      <div className="card-title">📊 近7天趋势</div>
      <div className="chart-container">
        <canvas ref={canvasRef} className="chart-canvas" />
      </div>
      <div className="chart-legend">
        <div className="chart-legend-item">
          <span className="chart-legend-dot" style={{ background: '#4CAF50' }} />
          达标
        </div>
        <div className="chart-legend-item">
          <span className="chart-legend-dot" style={{ background: '#F44336' }} />
          未达标
        </div>
        <div className="chart-legend-item">
          <span
            className="chart-legend-dot"
            style={{ background: '#4CAF50', width: '20px', height: '2px', borderRadius: '0' }}
          />
          推荐线
        </div>
      </div>
    </div>
  )
}
