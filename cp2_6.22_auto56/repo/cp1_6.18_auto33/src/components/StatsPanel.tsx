import { useEffect, useRef, useState } from 'react'
import { useSkillTreeStore } from '@/store/skillTreeStore'
import './StatsPanel.css'

export const StatsPanel = () => {
  const { getTodayCompletedCount, getWeeklyData, getCategoryDistribution } = useSkillTreeStore()
  const lineCanvasRef = useRef<HTMLCanvasElement>(null)
  const pieCanvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null)
  const [animated, setAnimated] = useState(false)

  const todayCount = getTodayCompletedCount()
  const weeklyData = getWeeklyData()
  const categoryData = getCategoryDistribution()

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = lineCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const fallbackW = 260
    const fallbackH = 160
    const w = canvas.clientWidth || fallbackW
    const h = canvas.clientHeight || fallbackH
    if (w <= 0 || h <= 0) return
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, w, h)

    const padding = { top: 20, right: 16, bottom: 30, left: 28 }
    const chartW = Math.max(w - padding.left - padding.right, 10)
    const chartH = Math.max(h - padding.top - padding.bottom, 10)

    ctx.strokeStyle = 'rgba(58, 58, 92, 0.4)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartH / 3) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(w - padding.right, y)
      ctx.stroke()
    }

    const maxVal = Math.max(...weeklyData.map((d) => d.count), 1)
    const stepX = chartW / (weeklyData.length - 1)

    const points: Array<{ x: number; y: number }> = weeklyData.map((d, i) => ({
      x: padding.left + stepX * i,
      y: padding.top + chartH - (d.count / maxVal) * chartH,
    }))

    ctx.beginPath()
    ctx.strokeStyle = '#6C63FF'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    points.forEach((p, i) => {
      if (!animated) return
      if (i === 0) ctx.moveTo(p.x, p.y)
      else ctx.lineTo(p.x, p.y)
    })
    ctx.stroke()

    if (animated) {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH)
      gradient.addColorStop(0, 'rgba(108, 99, 255, 0.25)')
      gradient.addColorStop(1, 'rgba(108, 99, 255, 0)')
      ctx.beginPath()
      ctx.moveTo(points[0].x, padding.top + chartH)
      points.forEach((p) => ctx.lineTo(p.x, p.y))
      ctx.lineTo(points[points.length - 1].x, padding.top + chartH)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()
    }

    points.forEach((p, i) => {
      if (!animated) return
      setTimeout(() => {
        const c2 = lineCanvasRef.current?.getContext('2d')
        if (!c2) return
        c2.beginPath()
        c2.arc(p.x, p.y, 6, 0, Math.PI * 2)
        c2.fillStyle = '#ffffff'
        c2.fill()
        c2.strokeStyle = '#6C63FF'
        c2.lineWidth = 2
        c2.stroke()
      }, i * 100)
    })

    ctx.fillStyle = '#8080A0'
    ctx.font = '11px Inter, sans-serif'
    ctx.textAlign = 'center'
    weeklyData.forEach((d, i) => {
      const x = padding.left + stepX * i
      ctx.fillText(d.day, x, h - 10)
    })
  }, [weeklyData, animated])

  useEffect(() => {
    const canvas = pieCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const fallbackW = 220
    const fallbackH = 220
    const w = canvas.clientWidth || fallbackW
    const h = canvas.clientHeight || fallbackH
    if (w <= 0 || h <= 0) return
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, w, h)

    const total = categoryData.reduce((sum, d) => sum + d.count, 0)
    const cx = w / 2
    const cy = h / 2
    const baseRadius = Math.max(Math.min(w, h) / 2 - 16, 10)

    if (total === 0) {
      ctx.beginPath()
      ctx.arc(cx, cy, baseRadius, 0, Math.PI * 2)
      ctx.fillStyle = '#2A2A3E'
      ctx.fill()
      ctx.fillStyle = '#8080A0'
      ctx.font = '12px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('暂无数据', cx, cy)
      return
    }

    let startAngle = -Math.PI / 2
    categoryData.forEach((d, i) => {
      const sliceAngle = (d.count / total) * Math.PI * 2
      const endAngle = startAngle + sliceAngle
      const isHovered = hoveredSlice === i
      const radius = isHovered ? baseRadius * 1.2 : baseRadius
      const offset = isHovered ? 8 : 0
      const midAngle = (startAngle + endAngle) / 2
      const ox = Math.cos(midAngle) * offset
      const oy = Math.sin(midAngle) * offset

      if (animated) {
        ctx.beginPath()
        ctx.moveTo(cx + ox, cy + oy)
        ctx.arc(cx + ox, cy + oy, radius, startAngle, endAngle)
        ctx.closePath()
        ctx.fillStyle = d.color
        ctx.fill()

        if (isHovered && d.count > 0) {
          const pct = ((d.count / total) * 100).toFixed(0) + '%'
          const labelR = radius * 0.6
          const lx = cx + ox + Math.cos(midAngle) * labelR
          const ly = cy + oy + Math.sin(midAngle) * labelR
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 13px Inter, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.shadowColor = 'rgba(0,0,0,0.5)'
          ctx.shadowBlur = 4
          ctx.fillText(pct, lx, ly)
          ctx.shadowBlur = 0
        }
      }

      startAngle = endAngle
    })

    ctx.beginPath()
    ctx.arc(cx, cy, baseRadius * 0.45, 0, Math.PI * 2)
    ctx.fillStyle = '#1E1E2E'
    ctx.fill()
  }, [categoryData, hoveredSlice, animated])

  const handlePieMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = pieCanvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const dx = x - cx
    const dy = y - cy
    const dist = Math.sqrt(dx * dx + dy * dy)
    const baseRadius = Math.max(Math.min(rect.width, rect.height) / 2 - 16, 1)
    if (dist < baseRadius * 0.45 || dist > baseRadius * 1.25) {
      setHoveredSlice(null)
      return
    }
    let angle = Math.atan2(dy, dx)
    if (angle < -Math.PI / 2) angle += Math.PI * 2
    angle += Math.PI / 2
    const total = categoryData.reduce((s, d) => s + d.count, 0)
    if (total === 0) return
    let acc = 0
    for (let i = 0; i < categoryData.length; i++) {
      const slice = (categoryData[i].count / total) * Math.PI * 2
      if (angle >= acc && angle < acc + slice) {
        setHoveredSlice(i)
        return
      }
      acc += slice
    }
    setHoveredSlice(null)
  }

  return (
    <aside className="stats-panel">
      <div className="panel-header">
        <h2 className="panel-title">📊 数据统计</h2>
      </div>

      <div className="stat-block">
        <div className="stat-label">今日完成</div>
        <div className="stat-number today-number">{todayCount}</div>
      </div>

      <div className="stat-block">
        <div className="stat-label">本周完成趋势</div>
        <div className="chart-wrapper">
          <canvas ref={lineCanvasRef} className="line-chart" />
        </div>
      </div>

      <div className="stat-block">
        <div className="stat-label">类别分布</div>
        <div className="chart-wrapper pie-wrapper">
          <canvas
            ref={pieCanvasRef}
            className="pie-chart"
            onMouseMove={handlePieMove}
            onMouseLeave={() => setHoveredSlice(null)}
          />
        </div>
        <div className="pie-legend">
          {categoryData.map((d) => (
            <div key={d.category} className="legend-item">
              <span className="legend-dot" style={{ background: d.color }} />
              <span className="legend-text">{d.name}</span>
              <span className="legend-count">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
