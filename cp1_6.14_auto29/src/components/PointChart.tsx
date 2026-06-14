// 数据流向：父组件传入 data → Canvas 绘制 → 动画帧更新渲染
// 依赖：React, @/types
// 外部调用：Dashboard 页面引入此组件，分别传入周数据（柱状图）和月数据（折线图）

import { useEffect, useRef, useState } from 'react'
import type { PointRecord } from '@/types'

interface PointChartProps {
  type: 'line' | 'bar'
  data: PointRecord[]
  width?: number
  height?: number
  title?: string
}

const easeOutQuad = (t: number): number => t * (2 - t)

const LINE_ANIMATION_DURATION = 1500
const BAR_ANIMATION_DURATION = 2000
const BAR_DELAY = 100
const FPS = 30
const FRAME_INTERVAL = 1000 / FPS

export default function PointChart({
  type,
  data,
  width = 600,
  height = 300,
  title,
}: PointChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const lastFrameTimeRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(width)

  const padding = { top: 40, right: 30, bottom: 40, left: 50 }

  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        if (newWidth > 0) {
          setContainerWidth(Math.min(newWidth, width))
        }
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [width])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const chartWidth = containerWidth - padding.left - padding.right
    const chartHeight = height - padding.top - padding.bottom

    canvas.width = containerWidth * dpr
    canvas.height = height * dpr
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    const maxPoints = Math.max(...data.map((d) => d.points), 1)
    const minPoints = 0
    const valueRange = maxPoints - minPoints || 1

    const getX = (index: number) => {
      if (data.length === 1) return padding.left + chartWidth / 2
      return padding.left + (index / (data.length - 1)) * chartWidth
    }

    const getY = (value: number) => {
      return padding.top + chartHeight - ((value - minPoints) / valueRange) * chartHeight
    }

    const drawAxes = () => {
      ctx.strokeStyle = '#e0e0e0'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding.left, padding.top)
      ctx.lineTo(padding.left, padding.top + chartHeight)
      ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight)
      ctx.stroke()

      ctx.fillStyle = '#666666'
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      data.forEach((d, i) => {
        ctx.fillText(d.date, getX(i), padding.top + chartHeight + 10)
      })

      ctx.textAlign = 'right'
      ctx.textBaseline = 'middle'
      const yTicks = 4
      for (let i = 0; i <= yTicks; i++) {
        const value = minPoints + (valueRange * i) / yTicks
        const y = getY(value)
        ctx.fillText(String(Math.round(value)), padding.left - 10, y)

        ctx.strokeStyle = '#f0f0f0'
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(padding.left + chartWidth, y)
        ctx.stroke()
      }
    }

    const drawTitle = () => {
      if (!title) return
      ctx.fillStyle = '#333333'
      ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(title, containerWidth / 2, 12)
    }

    const drawLineChart = (progress: number) => {
      const easedProgress = easeOutQuad(progress)
      const visiblePoints = Math.floor(data.length * easedProgress)
      const currentPointProgress = data.length * easedProgress - visiblePoints

      ctx.clearRect(0, 0, containerWidth, height)
      drawTitle()
      drawAxes()

      if (visiblePoints === 0 && currentPointProgress === 0) return

      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
      gradient.addColorStop(0, 'rgba(46, 125, 50, 0.3)')
      gradient.addColorStop(1, 'rgba(46, 125, 50, 0)')

      ctx.beginPath()
      ctx.moveTo(getX(0), padding.top + chartHeight)

      for (let i = 0; i <= visiblePoints && i < data.length; i++) {
        if (i === visiblePoints && i < data.length - 1) {
          const prevX = getX(i - 1)
          const prevY = getY(data[i - 1].points)
          const nextX = getX(i)
          const nextY = getY(data[i].points)
          const x = prevX + (nextX - prevX) * currentPointProgress
          const y = prevY + (nextY - prevY) * currentPointProgress
          ctx.lineTo(x, y)
        } else if (i < data.length) {
          ctx.lineTo(getX(i), getY(data[i].points))
        }
      }

      const lastIndex = Math.min(visiblePoints, data.length - 1)
      const lastX = visiblePoints < data.length
        ? getX(visiblePoints - 1) + (getX(visiblePoints) - getX(visiblePoints - 1)) * currentPointProgress
        : getX(lastIndex)
      const lastY = visiblePoints < data.length && visiblePoints > 0
        ? getY(data[visiblePoints - 1].points) + (getY(data[visiblePoints].points) - getY(data[visiblePoints - 1].points)) * currentPointProgress
        : getY(data[lastIndex].points)

      ctx.lineTo(lastX, padding.top + chartHeight)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.beginPath()
      ctx.strokeStyle = '#2E7D32'
      ctx.lineWidth = 2.5
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      for (let i = 0; i <= visiblePoints && i < data.length; i++) {
        if (i === 0) {
          ctx.moveTo(getX(0), getY(data[0].points))
        } else if (i === visiblePoints && i < data.length) {
          const prevX = getX(i - 1)
          const prevY = getY(data[i - 1].points)
          const nextX = getX(i)
          const nextY = getY(data[i].points)
          const x = prevX + (nextX - prevX) * currentPointProgress
          const y = prevY + (nextY - prevY) * currentPointProgress
          ctx.lineTo(x, y)
        } else if (i < data.length) {
          ctx.lineTo(getX(i), getY(data[i].points))
        }
      }
      ctx.stroke()

      const dotCount = visiblePoints + (currentPointProgress > 0 ? 1 : 0)
      for (let i = 0; i < dotCount && i < data.length; i++) {
        let x: number
        let y: number

        if (i === visiblePoints && i < data.length && i > 0) {
          const prevX = getX(i - 1)
          const prevY = getY(data[i - 1].points)
          const nextX = getX(i)
          const nextY = getY(data[i].points)
          x = prevX + (nextX - prevX) * currentPointProgress
          y = prevY + (nextY - prevY) * currentPointProgress
        } else {
          x = getX(i)
          y = getY(data[i].points)
        }

        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
        ctx.strokeStyle = '#2E7D32'
        ctx.lineWidth = 2
        ctx.stroke()
      }
    }

    const drawBarChart = (progress: number) => {
      ctx.clearRect(0, 0, containerWidth, height)
      drawTitle()
      drawAxes()

      const barCount = data.length
      const barWidth = chartWidth / barCount * 0.6
      const barGap = chartWidth / barCount * 0.4

      for (let i = 0; i < barCount; i++) {
        const delay = i * BAR_DELAY
        const totalDuration = BAR_ANIMATION_DURATION
        const barProgress = Math.max(0, Math.min(1, (progress * totalDuration - delay) / (totalDuration - (barCount - 1) * BAR_DELAY)))
        const easedBarProgress = easeOutQuad(barProgress)

        if (barProgress <= 0) continue

        const x = padding.left + barGap / 2 + i * (barWidth + barGap)
        const barHeight = chartHeight * (data[i].points / valueRange) * easedBarProgress
        const y = padding.top + chartHeight - barHeight

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
        gradient.addColorStop(0, '#2E7D32')
        gradient.addColorStop(1, '#A5D6A7')

        ctx.fillStyle = gradient
        ctx.beginPath()
        const radius = 4
        ctx.moveTo(x + radius, y)
        ctx.lineTo(x + barWidth - radius, y)
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius)
        ctx.lineTo(x + barWidth, y + barHeight)
        ctx.lineTo(x, y + barHeight)
        ctx.lineTo(x, y + radius)
        ctx.quadraticCurveTo(x, y, x + radius, y)
        ctx.closePath()
        ctx.fill()

        if (barProgress >= 0.3) {
          const textAlpha = Math.min(1, (barProgress - 0.3) / 0.3)
          ctx.fillStyle = `rgba(51, 51, 51, ${textAlpha})`
          ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'bottom'
          ctx.fillText(String(data[i].points), x + barWidth / 2, y - 6)
        }
      }
    }

    const startTime = performance.now()
    const totalDuration = type === 'line' ? LINE_ANIMATION_DURATION : BAR_ANIMATION_DURATION

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime

      if (currentTime - lastFrameTimeRef.current >= FRAME_INTERVAL) {
        lastFrameTimeRef.current = currentTime

        const progress = Math.min(elapsed / totalDuration, 1)

        if (type === 'line') {
          drawLineChart(progress)
        } else {
          drawBarChart(progress)
        }

        if (progress >= 1) {
          return
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [type, data, containerWidth, height, title, padding.left, padding.right, padding.top, padding.bottom])

  return (
    <div ref={containerRef} style={{ width: '100%', maxWidth: width }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}
