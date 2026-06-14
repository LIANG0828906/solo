import { useRef, useEffect, useState, useCallback } from 'react'
import type { TravelStats } from '@/types'

type YearlyData = TravelStats['yearlyData'][number]
type MonthlyData = TravelStats['monthlyData'][number]

interface YearlyBarChartProps {
  data: YearlyData[]
  monthlyData?: MonthlyData[]
}

interface Bar {
  x: number
  y: number
  width: number
  height: number
  label: string
  value: number
}

const GRADIENT_START = '#6B8DD6'
const GRADIENT_END = '#8B7BD6'
const GRADIENT_HOVER_START = '#5A7CC5'
const GRADIENT_HOVER_END = '#7A6AC5'

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height)
  ctx.lineTo(x, y + height)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

export default function YearlyBarChart({ data, monthlyData = [] }: YearlyBarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [viewMode, setViewMode] = useState<'year' | 'month'>('year')
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1)
  const progressRef = useRef(0)
  const barsRef = useRef<Bar[]>([])

  const getDisplayData = useCallback((): { label: string; value: number }[] => {
    if (viewMode === 'year') {
      return data.map(d => ({ label: String(d.year), value: d.count }))
    }
    const yearMonths = monthlyData
      .filter(m => m.year === selectedYear)
      .sort((a, b) => a.month - b.month)
    
    const result = []
    for (let i = 1; i <= 12; i++) {
      const found = yearMonths.find(m => m.month === i)
      result.push({ label: `${i}月`, value: found?.count || 0 })
    }
    return result
  }, [viewMode, selectedYear, data, monthlyData])

  const getMaxValue = useCallback((): number => {
    const displayData = getDisplayData()
    const max = Math.max(...displayData.map(d => d.value), 1)
    const niceMax = Math.ceil(max / 5) * 5
    return Math.max(niceMax, 5)
  }, [getDisplayData])

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => {
    ctx.clearRect(0, 0, width, height)

    const dpr = window.devicePixelRatio || 1
    const paddingLeft = 50 * dpr
    const paddingRight = 20 * dpr
    const paddingTop = 20 * dpr
    const paddingBottom = 40 * dpr

    const chartWidth = width - paddingLeft - paddingRight
    const chartHeight = height - paddingTop - paddingBottom

    const displayData = getDisplayData()
    const maxValue = getMaxValue()

    ctx.fillStyle = '#8D6E63'
    ctx.font = `${12 * dpr}px 'Segoe UI', 'PingFang SC', sans-serif`
    ctx.textAlign = 'right'
    ctx.textBaseline = 'middle'

    const yTicks = 5
    for (let i = 0; i <= yTicks; i++) {
      const y = paddingTop + chartHeight - (i / yTicks) * chartHeight
      const value = Math.round((i / yTicks) * maxValue)
      ctx.fillText(String(value), paddingLeft - 8 * dpr, y)

      ctx.strokeStyle = 'rgba(184, 196, 208, 0.5)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(paddingLeft, y)
      ctx.lineTo(paddingLeft + chartWidth, y)
      ctx.stroke()
    }

    const bars: Bar[] = []
    const barCount = displayData.length
    const barGap = 8 * dpr
    const barWidth = (chartWidth - barGap * (barCount + 1)) / barCount

    displayData.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight * easeOutCubic(progress)
      const x = paddingLeft + barGap + index * (barWidth + barGap)
      const y = paddingTop + chartHeight - barHeight

      bars.push({
        x,
        y,
        width: barWidth,
        height: barHeight,
        label: item.label,
        value: item.value
      })

      const isHovered = hoveredIndex === index
      const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
      if (isHovered) {
        gradient.addColorStop(0, GRADIENT_HOVER_START)
        gradient.addColorStop(1, GRADIENT_HOVER_END)
      } else {
        gradient.addColorStop(0, GRADIENT_START)
        gradient.addColorStop(1, GRADIENT_END)
      }

      ctx.fillStyle = gradient
      const radius = Math.min(barWidth / 2, 6 * dpr)
      drawRoundRect(ctx, x, y, barWidth, barHeight, radius)
      ctx.fill()

      ctx.fillStyle = '#5D4037'
      ctx.font = `${11 * dpr}px 'Segoe UI', 'PingFang SC', sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(item.label, x + barWidth / 2, paddingTop + chartHeight + 8 * dpr)
    })

    barsRef.current = bars
  }, [getDisplayData, getMaxValue, hoveredIndex])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    progressRef.current += 0.03
    if (progressRef.current >= 1) {
      progressRef.current = 1
      draw(ctx, dimensions.width, dimensions.height, 1)
      return
    }

    draw(ctx, dimensions.width, dimensions.height, progressRef.current)
    animationRef.current = requestAnimationFrame(animate)
  }, [dimensions, draw])

  const handleResize = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const newWidth = rect.width * dpr
    const newHeight = rect.height * dpr
    setDimensions({ width: newWidth, height: newHeight })
    
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const x = (e.clientX - rect.left) * dpr
    const y = (e.clientY - rect.top) * dpr

    let foundIndex = -1
    barsRef.current.forEach((bar, index) => {
      if (x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height) {
        foundIndex = index
      }
    })

    if (foundIndex !== hoveredIndex) {
      setHoveredIndex(foundIndex)
      const ctx = canvas.getContext('2d')
      if (ctx) {
        draw(ctx, dimensions.width, dimensions.height, progressRef.current)
      }
    }
  }, [hoveredIndex, dimensions, draw])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const x = (e.clientX - rect.left) * dpr
    const y = (e.clientY - rect.top) * dpr

    barsRef.current.forEach((bar, index) => {
      if (x >= bar.x && x <= bar.x + bar.width && y >= bar.y && y <= bar.y + bar.height) {
        if (viewMode === 'year' && data[index]) {
          setSelectedYear(data[index].year)
          setViewMode('month')
          progressRef.current = 0
        }
      }
    })
  }, [viewMode, data])

  const handleBack = useCallback(() => {
    setViewMode('year')
    setSelectedYear(null)
    setHoveredIndex(-1)
    progressRef.current = 0
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return

    progressRef.current = 0
    animate()
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions, viewMode, animate])

  return (
    <div className="yearly-chart-wrapper">
      {viewMode === 'month' && (
        <button
          onClick={handleBack}
          className="btn btn-secondary back-button"
        >
          ← 返回年度视图
        </button>
      )}
      <div ref={containerRef} className="chart-container yearly-chart-container">
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="chart-canvas"
          onMouseMove={handleMouseMove}
          onClick={handleClick}
          style={{ cursor: hoveredIndex >= 0 ? 'pointer' : 'default' }}
        />
      </div>
    </div>
  )
}
