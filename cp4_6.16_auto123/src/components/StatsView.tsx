import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useTripStore } from '../stores/tripStore'

interface ChartDataPoint {
  date: string
  weight: number
  tripName: string
}

const StatsView: React.FC = () => {
  const { getCompletedTrips, calculateTripWeight } = useTripStore()
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const animationProgressRef = useRef<number>(0)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; data: ChartDataPoint | null }>({
    visible: false,
    x: 0,
    y: 0,
    data: null
  })

  const padding = { top: 40, right: 40, bottom: 60, left: 60 }
  const dotRadius = 6

  const loadCompletedTrips = useCallback(() => {
    const trips = getCompletedTrips()
    const data: ChartDataPoint[] = trips.map(trip => ({
      date: trip.endDate,
      weight: trip.totalWeight ?? calculateTripWeight(trip.id),
      tripName: trip.name
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    setChartData(data)
  }, [getCompletedTrips, calculateTripWeight])

  useEffect(() => {
    loadCompletedTrips()
  }, [loadCompletedTrips])

  const drawStaticElements = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, data: ChartDataPoint[]) => {
    ctx.clearRect(0, 0, width, height)

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)

    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const weights = data.map(d => d.weight)
    const minWeight = weights.length > 0 ? Math.min(...weights) : 0
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 10
    const weightRange = maxWeight - minWeight || 1

    ctx.strokeStyle = '#E0E0E0'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])

    const gridLines = 5
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()

      const weight = maxWeight - (weightRange / gridLines) * i
      ctx.fillStyle = '#5C6BC0'
      ctx.font = '12px -apple-system, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(weight.toFixed(1) + ' kg', padding.left - 10, y + 4)
    }

    ctx.setLineDash([])
    ctx.strokeStyle = '#D0E0FF'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(padding.left, padding.top)
    ctx.lineTo(padding.left, height - padding.bottom)
    ctx.lineTo(width - padding.right, height - padding.bottom)
    ctx.stroke()

    if (data.length > 0) {
      const stepX = chartWidth / (data.length > 1 ? data.length - 1 : 1)
      data.forEach((point, index) => {
        const x = padding.left + stepX * index
        const date = new Date(point.date)
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`
        
        ctx.fillStyle = '#5C6BC0'
        ctx.font = '11px -apple-system, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(dateStr, x, height - padding.bottom + 20)
      })
    }

    ctx.fillStyle = '#1A237E'
    ctx.font = '14px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('日期', width / 2, height - 15)

    ctx.save()
    ctx.translate(15, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('重量 (kg)', 0, 0)
    ctx.restore()
  }, [])

  const drawDynamicElements = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, data: ChartDataPoint[], progress: number) => {
    if (data.length < 2) return

    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const weights = data.map(d => d.weight)
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)
    const weightRange = maxWeight - minWeight || 1

    const gradient = ctx.createLinearGradient(padding.left, 0, width - padding.right, 0)
    gradient.addColorStop(0, '#2196F3')
    gradient.addColorStop(1, '#42A5F5')

    ctx.strokeStyle = gradient
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const stepX = chartWidth / (data.length - 1)
    const points = data.map((point, index) => {
      const x = padding.left + stepX * index
      const y = padding.top + chartHeight - ((point.weight - minWeight) / weightRange) * chartHeight
      return { x, y }
    })

    ctx.beginPath()
    points.forEach((point, index) => {
      const animatedProgress = Math.min(1, progress * 2 - index * 0.1)
      if (animatedProgress <= 0) return
      
      const prevPoint = index > 0 ? points[index - 1] : point
      const currentX = prevPoint.x + (point.x - prevPoint.x) * Math.min(1, animatedProgress)
      const currentY = prevPoint.y + (point.y - prevPoint.y) * Math.min(1, animatedProgress)

      if (index === 0 || animatedProgress <= 0) {
        ctx.moveTo(currentX, currentY)
      } else {
        ctx.lineTo(currentX, currentY)
      }
    })
    ctx.stroke()

    points.forEach((point, index) => {
      const dotProgress = Math.min(1, progress * 2 - index * 0.15)
      if (dotProgress <= 0) return

      const scale = dotProgress
      const radius = dotRadius * scale

      ctx.beginPath()
      ctx.arc(point.x, point.y, radius + 4, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(33, 150, 243, ${0.2 * dotProgress})`
      ctx.fill()

      ctx.beginPath()
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.strokeStyle = '#2196F3'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(point.x, point.y, radius * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = '#42A5F5'
      ctx.fill()
    })
  }, [])

  const renderChart = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const rect = container.getBoundingClientRect()
    const width = rect.width
    const height = Math.max(300, rect.height)

    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.scale(dpr, dpr)

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas')
    }
    const offscreen = offscreenCanvasRef.current
    offscreen.width = width * dpr
    offscreen.height = height * dpr
    const offscreenCtx = offscreen.getContext('2d')
    if (!offscreenCtx) return

    offscreenCtx.scale(dpr, dpr)
    drawStaticElements(offscreenCtx, width, height, chartData)

    ctx.drawImage(offscreen, 0, 0, width, height)

    animationProgressRef.current = 0

    const animate = () => {
      animationProgressRef.current += 0.02
      if (animationProgressRef.current > 1) {
        animationProgressRef.current = 1
      }

      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(offscreen, 0, 0, width, height)
      drawDynamicElements(ctx, width, height, chartData, animationProgressRef.current)

      if (animationProgressRef.current < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [chartData, drawStaticElements, drawDynamicElements])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || chartData.length < 2) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const width = rect.width
    const height = Math.max(300, rect.height)
    const chartWidth = width - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    const stepX = chartWidth / (chartData.length - 1)

    let closestPoint: ChartDataPoint | null = null
    let closestDist = Infinity
    let closestX = 0
    let closestY = 0

    const weights = chartData.map(d => d.weight)
    const minWeight = Math.min(...weights)
    const maxWeight = Math.max(...weights)
    const weightRange = maxWeight - minWeight || 1

    chartData.forEach((point, index) => {
      const x = padding.left + stepX * index
      const y = padding.top + chartHeight - ((point.weight - minWeight) / weightRange) * chartHeight
      const dist = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2)

      if (dist < closestDist && dist < 20) {
        closestDist = dist
        closestPoint = point
        closestX = x
        closestY = y
      }
    })

    if (closestPoint) {
      setTooltip({
        visible: true,
        x: closestX,
        y: closestY,
        data: closestPoint
      })
    } else {
      setTooltip(prev => ({ ...prev, visible: false }))
    }
  }, [chartData])

  const handleMouseLeave = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }))
  }, [])

  useEffect(() => {
    renderChart()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [renderChart])

  useEffect(() => {
    let timeoutId: number

    const handleResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
        renderChart()
      }, 150)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [renderChart])

  const completedTrips = useTripStore.getState().getCompletedTrips()
  
  const totalTrips = completedTrips.length
  const totalItems = completedTrips.reduce((sum, trip) => sum + trip.luggageItems.length, 0)
  const weights = completedTrips.map(trip => trip.totalWeight ?? useTripStore.getState().calculateTripWeight(trip.id))
  const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0

  const heaviestTrip = completedTrips.find(trip => 
    (trip.totalWeight ?? useTripStore.getState().calculateTripWeight(trip.id)) === maxWeight
  )
  const lightestTrip = completedTrips.find(trip => 
    (trip.totalWeight ?? useTripStore.getState().calculateTripWeight(trip.id)) === minWeight
  )

  const handleShare = useCallback(() => {
    const trips = getCompletedTrips()
    const tripWeights = trips.map(trip => ({
      name: trip.name,
      destination: trip.destination,
      date: trip.endDate,
      weight: trip.totalWeight ?? calculateTripWeight(trip.id),
      items: trip.luggageItems.length
    }))

    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NomadNest - 旅行报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #F0F6FF 0%, #E3F2FD 100%);
      padding: 40px 20px;
      color: #1A237E;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 10px 40px rgba(26, 35, 126, 0.15);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 3px solid #E3F2FD;
    }
    .logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #2196F3, #42A5F5);
      border-radius: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 30px;
    }
    h1 {
      font-size: 32px;
      font-weight: 800;
      margin-bottom: 8px;
      background: linear-gradient(135deg, #1A237E, #2196F3);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle {
      color: #5C6BC0;
      font-size: 16px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: linear-gradient(135deg, #F0F6FF, #E3F2FD);
      padding: 24px;
      border-radius: 16px;
      text-align: center;
      border: 2px solid #D0E0FF;
    }
    .stat-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }
    .stat-value {
      font-size: 36px;
      font-weight: 800;
      color: #2196F3;
      margin-bottom: 4px;
    }
    .stat-label {
      font-size: 14px;
      color: #5C6BC0;
      font-weight: 600;
    }
    .section-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 20px;
      padding-left: 12px;
      border-left: 4px solid #2196F3;
    }
    .trip-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .trip-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px;
      background: #F8FAFF;
      border-radius: 12px;
      border: 1px solid #D0E0FF;
      transition: all 0.3s ease;
    }
    .trip-item:hover {
      transform: translateX(5px);
      border-color: #42A5F5;
    }
    .trip-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .trip-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #2196F3, #42A5F5);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
    .trip-details h3 {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 4px;
    }
    .trip-details p {
      font-size: 13px;
      color: #5C6BC0;
    }
    .trip-stats {
      text-align: right;
    }
    .trip-weight {
      font-size: 20px;
      font-weight: 800;
      color: #2196F3;
    }
    .trip-items {
      font-size: 12px;
      color: #5C6BC0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1px solid #E3F2FD;
      color: #5C6BC0;
      font-size: 13px;
    }
    .highlight {
      background: linear-gradient(135deg, #FFD54F, #FFB300);
      color: #1A237E;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🧳</div>
      <h1>我的旅行报告</h1>
      <p class="subtitle">NomadNest 行李打包统计</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">✈️</div>
        <div class="stat-value">${totalTrips}</div>
        <div class="stat-label">总旅行次数</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📦</div>
        <div class="stat-value">${totalItems}</div>
        <div class="stat-label">累计打包物品</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">⚖️</div>
        <div class="stat-value">${avgWeight.toFixed(1)}</div>
        <div class="stat-label">平均重量 (kg)</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏋️</div>
        <div class="stat-value">${maxWeight.toFixed(1)}</div>
        <div class="stat-label">最重行李 (kg)</div>
      </div>
    </div>

    <h2 class="section-title">旅行记录</h2>
    <div class="trip-list">
      ${tripWeights.map((trip, index) => `
        <div class="trip-item">
          <div class="trip-info">
            <div class="trip-icon">📍</div>
            <div class="trip-details">
              <h3>${trip.name} ${index === 0 ? '<span class="highlight">最近</span>' : ''}</h3>
              <p>${trip.destination} · ${new Date(trip.date).toLocaleDateString('zh-CN')}</p>
            </div>
          </div>
          <div class="trip-stats">
            <div class="trip-weight">${trip.weight.toFixed(1)} kg</div>
            <div class="trip-items">${trip.items} 件物品</div>
          </div>
        </div>
      `).join('')}
    </div>

    ${heaviestTrip ? `
      <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #FFF3E0, #FFE0B2); border-radius: 12px; border-left: 4px solid #FF9800;">
        <p style="font-size: 14px; color: #E65100;">
          <strong>🏆 最重行李记录：</strong>${heaviestTrip.name} - ${maxWeight.toFixed(1)} kg
        </p>
      </div>
    ` : ''}

    <div class="footer">
      <p>由 NomadNest 生成于 ${new Date().toLocaleString('zh-CN')}</p>
      <p style="margin-top: 8px;">让每一次旅行都井井有条 ✨</p>
    </div>
  </div>
</body>
</html>`

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `旅行报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [getCompletedTrips, calculateTripWeight, totalTrips, totalItems, avgWeight, maxWeight, heaviestTrip])

  const stats = [
    { icon: '✈️', label: '总旅行次数', value: totalTrips, unit: '次' },
    { icon: '📦', label: '累计打包物品', value: totalItems, unit: '件' },
    { icon: '⚖️', label: '平均行李重量', value: avgWeight.toFixed(1), unit: 'kg' },
    { icon: '🏋️', label: '最重行李', value: maxWeight.toFixed(1), unit: 'kg' },
    { icon: '🪶', label: '最轻行李', value: minWeight.toFixed(1), unit: 'kg' }
  ]

  return (
    <div className="route-transition">
      <div className="page-header">
        <h1 className="page-title">📊 数据统计</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          查看你的旅行历史数据和行李重量趋势
        </p>
      </div>

      <div className="stats-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className="card fade-in-slide-up"
            style={{
              animationDelay: `${index * 0.05}s`,
              opacity: 0,
              textAlign: 'center'
            }}
          >
            <div style={{
              fontSize: '36px',
              marginBottom: '12px'
            }}>
              {stat.icon}
            </div>
            <div style={{
              fontSize: '32px',
              fontWeight: 800,
              color: 'var(--accent-blue)',
              marginBottom: '4px'
            }}>
              {stat.value}
              <span style={{ fontSize: '16px', marginLeft: '4px', color: 'var(--text-secondary)' }}>
                {stat.unit}
              </span>
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--text-secondary)',
              fontWeight: 500
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div
        className="card fade-in-slide-up"
        style={{ animationDelay: '0.25s', opacity: 0, marginBottom: '32px' }}
      >
        <div className="card-header">
          <h2 className="card-title">📈 行李重量趋势</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            共 {chartData.length} 条记录
          </span>
        </div>
        <div ref={containerRef} style={{ position: 'relative', width: '100%', minHeight: '300px' }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', cursor: 'crosshair' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
          {tooltip.visible && tooltip.data && (
            <div style={{
              position: 'absolute',
              left: tooltip.x + 15,
              top: tooltip.y - 40,
              background: 'var(--accent-dark)',
              color: 'white',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(26, 35, 126, 0.3)',
              animation: 'slideDown 0.15s ease-out',
              whiteSpace: 'nowrap'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px' }}>{tooltip.data.tripName}</div>
              <div style={{ opacity: 0.9 }}>
                {new Date(tooltip.data.date).toLocaleDateString('zh-CN')}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, marginTop: '4px', color: '#42A5F5' }}>
                {tooltip.data.weight.toFixed(1)} kg
              </div>
            </div>
          )}
          {chartData.length < 2 && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
              <p>完成至少 2 次旅行后显示趋势图</p>
            </div>
          )}
        </div>
      </div>

      {heaviestTrip && lightestTrip && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}>
          <div className="card fade-in-slide-up" style={{
            animationDelay: '0.3s',
            opacity: 0,
            background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
            borderColor: '#FFCC80'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🏋️
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#E65100', fontWeight: 600 }}>最重行李记录</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#E65100' }}>
                  {maxWeight.toFixed(1)} kg
                </div>
              </div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A237E' }}>
              {heaviestTrip.name}
            </div>
            <div style={{ fontSize: '13px', color: '#E65100', marginTop: '4px' }}>
              📍 {heaviestTrip.destination} · {new Date(heaviestTrip.endDate).toLocaleDateString('zh-CN')}
            </div>
          </div>

          <div className="card fade-in-slide-up" style={{
            animationDelay: '0.35s',
            opacity: 0,
            background: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
            borderColor: '#A5D6A7'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #4CAF50, #388E3C)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                🪶
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#2E7D32', fontWeight: 600 }}>最轻行李记录</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#2E7D32' }}>
                  {minWeight.toFixed(1)} kg
                </div>
              </div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A237E' }}>
              {lightestTrip.name}
            </div>
            <div style={{ fontSize: '13px', color: '#2E7D32', marginTop: '4px' }}>
              📍 {lightestTrip.destination} · {new Date(lightestTrip.endDate).toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
        <button
          className="btn btn-primary fade-in-slide-up"
          style={{ animationDelay: '0.4s', opacity: 0, padding: '14px 32px', fontSize: '16px' }}
          onClick={handleShare}
        >
          <span style={{ fontSize: '20px' }}>📄</span>
          生成旅行报告
        </button>
      </div>
    </div>
  )
}

export default StatsView
