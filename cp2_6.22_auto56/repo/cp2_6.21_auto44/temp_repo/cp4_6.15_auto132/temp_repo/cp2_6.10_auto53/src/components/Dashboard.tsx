import React, { useEffect, useRef } from 'react'
import { useStationStore } from '../store/useStationStore'

const Dashboard: React.FC = () => {
  const {
    caravanCount,
    horseChangeCount,
    travelers,
    score,
    hourlyStats,
    logs
  } = useStationStore()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const lastSampleRef = useRef<number>(0)

  const currentTravelers = travelers.filter(t => t.roomNumber !== null).length

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const drawChart = () => {
      const now = Date.now()
      if (now - lastSampleRef.current >= 5000) {
        lastSampleRef.current = now
      }

      const width = rect.width
      const height = rect.height
      const padding = { top: 20, right: 20, bottom: 30, left: 40 }
      const chartWidth = width - padding.left - padding.right
      const chartHeight = height - padding.top - padding.bottom

      ctx.clearRect(0, 0, width, height)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.fillRect(0, 0, width, height)

      ctx.strokeStyle = 'rgba(139, 111, 71, 0.1)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(width - padding.right, y)
        ctx.stroke()
      }

      const stats = [...hourlyStats].sort((a, b) => a.hour - b.hour)
      while (stats.length < 6) {
        const firstHour = stats.length > 0 ? stats[0].hour : new Date().getHours()
        const prevHour = (firstHour - 1 + 24) % 24
        stats.unshift({ hour: prevHour, count: 0 })
      }

      const maxCount = Math.max(...stats.map(s => s.count), 1)
      const pointSpacing = chartWidth / (stats.length - 1)

      const points = stats.map((stat, i) => ({
        x: padding.left + pointSpacing * i,
        y: padding.top + chartHeight - (stat.count / maxCount) * chartHeight
      }))

      ctx.beginPath()
      ctx.moveTo(points[0].x, padding.top + chartHeight)
      points.forEach((point, i) => {
        if (i === 0) {
          ctx.lineTo(point.x, point.y)
        } else {
          const prev = points[i - 1]
          const cpx = (prev.x + point.x) / 2
          ctx.bezierCurveTo(cpx, prev.y, cpx, point.y, point.x, point.y)
        }
      })
      ctx.lineTo(points[points.length - 1].x, padding.top + chartHeight)
      ctx.closePath()

      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
      gradient.addColorStop(0, 'rgba(160, 82, 45, 0.3)')
      gradient.addColorStop(1, 'rgba(160, 82, 45, 0.05)')
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      points.forEach((point, i) => {
        if (i > 0) {
          const prev = points[i - 1]
          const cpx = (prev.x + point.x) / 2
          ctx.bezierCurveTo(cpx, prev.y, cpx, point.y, point.x, point.y)
        }
      })
      ctx.strokeStyle = '#a0522d'
      ctx.lineWidth = 2.5
      ctx.stroke()

      points.forEach((point, i) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = stats[i].count > 0 ? '#cc7722' : '#c4956a'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.fillStyle = '#2e5e82'
        ctx.font = 'bold 11px "Noto Serif SC", serif'
        ctx.textAlign = 'center'
        ctx.fillText(stats[i].count.toString(), point.x, point.y - 10)
      })

      ctx.fillStyle = '#8b6f47'
      ctx.font = '10px "Noto Serif SC", serif'
      ctx.textAlign = 'center'
      stats.forEach((stat, i) => {
        const x = padding.left + pointSpacing * i
        ctx.fillText(`${stat.hour}时`, x, height - 10)
      })

      ctx.save()
      ctx.translate(10, padding.top + chartHeight / 2)
      ctx.rotate(-Math.PI / 2)
      ctx.fillStyle = '#8b6f47'
      ctx.font = '10px "Noto Serif SC", serif'
      ctx.textAlign = 'center'
      ctx.fillText('驼队数', 0, 0)
      ctx.restore()

      animationRef.current = requestAnimationFrame(drawChart)
    }

    drawChart()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [hourlyStats])

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getLogTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      caravan: '🐪 驼队',
      traveler: '👤 旅人',
      horse: '🐎 马匹',
      beacon: '🔥 烽燧',
      verification: '📜 核验',
      error: '❌ 错误',
      warning: '⚠️ 警告',
      log: '📋 日志'
    }
    return labels[type] || '📋'
  }

  return (
    <div className="dashboard">
      <h2>📊 驿站运行统计</h2>

      <div className="stat-card">
        <div className="label">今日接待驼队</div>
        <div className="value">{caravanCount} 支</div>
      </div>

      <div className="stat-card">
        <div className="label">已更换马匹</div>
        <div className="value">{horseChangeCount} 匹</div>
      </div>

      <div className="stat-card">
        <div className="label">当前入住旅人</div>
        <div className="value">{currentTravelers} 人</div>
      </div>

      <div className={`stat-card score ${score < 60 ? 'low' : ''}`}>
        <div className="label">月度考评分数</div>
        <div className="value">{score} 分</div>
      </div>

      <div className="chart-container">
        <h3>📈 过去6小时繁忙度</h3>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '150px', display: 'block' }}
        />
      </div>

      <div className="log-panel">
        <h3>📋 驿站日志</h3>
        {logs.length === 0 ? (
          <p style={{ color: 'var(--smoke-gray)', textAlign: 'center', padding: '20px', fontSize: '0.85rem' }}>
            暂无日志记录
          </p>
        ) : (
          logs.slice(0, 15).map(log => (
            <div key={log.id} className={`log-entry ${log.level}`}>
              <span className="time">{formatTime(log.time)} {getLogTypeLabel(log.type)}</span>
              {log.message}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Dashboard
