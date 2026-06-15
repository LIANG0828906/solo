import { useRef, useEffect, useState, useCallback } from 'react'
import type { TravelStats } from '@/types'

type CityData = TravelStats['topCities'][number]

interface TopCitiesChartProps {
  data: CityData[]
}

const GRADIENT_START = '#6B8DD6'
const GRADIENT_END = '#8B7BD6'

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
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

export default function TopCitiesChart({ data }: TopCitiesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const progressRef = useRef(0)

  const displayData = data.slice(0, 5)

  const getMaxCount = useCallback((): number => {
    if (displayData.length === 0) return 1
    return Math.max(...displayData.map(d => d.count), 1)
  }, [displayData])

  const draw = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) => {
    ctx.clearRect(0, 0, width, height)

    if (displayData.length === 0) return

    const dpr = window.devicePixelRatio || 1
    const paddingLeft = 100 * dpr
    const paddingRight = 50 * dpr
    const paddingTop = 10 * dpr
    const paddingBottom = 10 * dpr

    const chartWidth = width - paddingLeft - paddingRight
    const chartHeight = height - paddingTop - paddingBottom

    const itemCount = displayData.length
    const itemGap = 12 * dpr
    const barHeight = (chartHeight - itemGap * (itemCount - 1)) / itemCount
    const maxCount = getMaxCount()

    displayData.forEach((item, index) => {
      const y = paddingTop + index * (barHeight + itemGap)
      const barWidth = (item.count / maxCount) * chartWidth * easeOutCubic(progress)

      const trackX = paddingLeft
      const trackY = y + barHeight / 2 - barHeight / 2
      
      ctx.fillStyle = '#D0D9E2'
      drawRoundRect(ctx, trackX, trackY, chartWidth, barHeight, barHeight / 2)
      ctx.fill()

      if (barWidth > 0) {
        const gradient = ctx.createLinearGradient(trackX, trackY, trackX + barWidth, trackY)
        gradient.addColorStop(0, GRADIENT_START)
        gradient.addColorStop(1, GRADIENT_END)
        ctx.fillStyle = gradient
        drawRoundRect(ctx, trackX, trackY, barWidth, barHeight, barHeight / 2)
        ctx.fill()
      }

      ctx.fillStyle = '#5D4037'
      ctx.font = `${13 * dpr}px 'Segoe UI', 'PingFang SC', sans-serif`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      ctx.fillText(item.city, paddingLeft - 12 * dpr, y + barHeight / 2)

      if (progress >= 0.3) {
        const countProgress = Math.min((progress - 0.3) / 0.7, 1)
        const displayCount = Math.round(item.count * easeOutCubic(countProgress))
        
        ctx.fillStyle = '#FFFFFF'
        ctx.font = `bold ${12 * dpr}px 'Segoe UI', 'PingFang SC', sans-serif`
        ctx.textAlign = 'right'
        ctx.textBaseline = 'middle'
        
        const countX = trackX + barWidth - 10 * dpr
        if (barWidth > 40 * dpr) {
          ctx.fillText(String(displayCount), countX, y + barHeight / 2)
        } else {
          ctx.fillStyle = '#5D4037'
          ctx.fillText(String(displayCount), trackX + barWidth + 8 * dpr, y + barHeight / 2)
        }
      }
    })
  }, [displayData, getMaxCount])

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    progressRef.current += 0.025
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
    setDimensions({ width: rect.width * dpr, height: rect.height * dpr })
    
    const canvas = canvasRef.current
    if (canvas) {
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
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
  }, [dimensions, animate])

  return (
    <div ref={containerRef} className="chart-container top-cities-container">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="chart-canvas"
      />
    </div>
  )
}
