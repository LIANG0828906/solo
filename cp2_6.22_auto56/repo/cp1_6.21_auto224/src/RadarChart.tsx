import { useRef, useEffect, forwardRef, useImperativeHandle } from 'react'

interface RadarChartProps {
  ratings: number[]
  size?: number
  isAnimating?: boolean
}

const RadarChart = forwardRef<HTMLCanvasElement, RadarChartProps>(
  ({ ratings, size = 320, isAnimating = false }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationFrameRef = useRef<number | null>(null)
    const currentRatingsRef = useRef<number[]>([...ratings])
    const targetRatingsRef = useRef<number[]>([...ratings])
    const isDraggingRef = useRef(isAnimating)

    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement)

    const labels = ['酸度', '甜度', '苦味', '醇厚度', '回甘']
    const sides = 5
    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.38

    useEffect(() => {
      targetRatingsRef.current = [...ratings]
    }, [ratings])

    useEffect(() => {
      isDraggingRef.current = isAnimating
    }, [isAnimating])

    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = size
      canvas.height = size

      const drawPolygon = (
        ctx: CanvasRenderingContext2D,
        r: number,
        fillStyle?: string,
        strokeStyle?: string
      ) => {
        ctx.beginPath()
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
          const x = centerX + r * Math.cos(angle)
          const y = centerY + r * Math.sin(angle)
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()
        if (fillStyle) {
          ctx.fillStyle = fillStyle
          ctx.fill()
        }
        if (strokeStyle) {
          ctx.strokeStyle = strokeStyle
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      const drawRoundedRect = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number
      ) => {
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

      const draw = (ctx: CanvasRenderingContext2D, currentRatings: number[], dragging: boolean) => {
        ctx.clearRect(0, 0, size, size)

        drawRoundedRect(ctx, 0, 0, size, size, 16)
        ctx.fillStyle = '#0F172A'
        ctx.fill()

        for (let i = 1; i <= 5; i++) {
          const r = (radius * i) / 5
          drawPolygon(ctx, r, undefined, '#334155')
        }

        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
          const x = centerX + radius * Math.cos(angle)
          const y = centerY + radius * Math.sin(angle)
          ctx.beginPath()
          ctx.moveTo(centerX, centerY)
          ctx.lineTo(x, y)
          ctx.strokeStyle = '#334155'
          ctx.lineWidth = 1
          ctx.stroke()
        }

        ctx.font = '12px sans-serif'
        ctx.fillStyle = '#94A3B8'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
          const labelRadius = radius + 22
          const x = centerX + labelRadius * Math.cos(angle)
          const y = centerY + labelRadius * Math.sin(angle)
          ctx.fillText(labels[i], x, y)
        }

        ctx.beginPath()
        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
          const r = (radius * currentRatings[i]) / 10
          const x = centerX + r * Math.cos(angle)
          const y = centerY + r * Math.sin(angle)
          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }
        ctx.closePath()

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
        gradient.addColorStop(0, 'rgba(245, 158, 11, 0.2)')
        gradient.addColorStop(1, 'rgba(245, 158, 11, 0.2)')
        ctx.fillStyle = gradient
        ctx.fill()

        if (dragging) {
          const lineGradient = ctx.createLinearGradient(
            centerX - radius,
            centerY - radius,
            centerX + radius,
            centerY + radius
          )
          lineGradient.addColorStop(0, '#FCD34D')
          lineGradient.addColorStop(1, '#F59E0B')
          ctx.strokeStyle = lineGradient
        } else {
          ctx.strokeStyle = '#F59E0B'
        }
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.stroke()

        for (let i = 0; i < sides; i++) {
          const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
          const r = (radius * currentRatings[i]) / 10
          const x = centerX + r * Math.cos(angle)
          const y = centerY + r * Math.sin(angle)
          ctx.beginPath()
          ctx.arc(x, y, 4, 0, Math.PI * 2)
          ctx.fillStyle = '#F59E0B'
          ctx.fill()
        }
      }

      const animate = () => {
        const target = targetRatingsRef.current
        const current = currentRatingsRef.current
        let hasDiff = false

        for (let i = 0; i < sides; i++) {
          if (Math.abs(current[i] - target[i]) > 0.01) {
            hasDiff = true
            break
          }
        }

        if (hasDiff) {
          for (let i = 0; i < sides; i++) {
            current[i] = current[i] + (target[i] - current[i]) * 0.2
          }
        }

        draw(ctx, current, isDraggingRef.current)

        if (hasDiff) {
          animationFrameRef.current = requestAnimationFrame(animate)
        } else {
          animationFrameRef.current = requestAnimationFrame(animate)
        }
      }

      animate()

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }, [size])

    return (
      <canvas
        ref={canvasRef}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transition: 'filter 0.15s ease'
        }}
      />
    )
  }
)

RadarChart.displayName = 'RadarChart'

export default RadarChart
