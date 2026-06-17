import { useEffect, useRef, useState } from 'react'
import { useGradientStore, ColorStop, GradientType, RadialShape } from '../stores/gradientStore'

interface GradientCanvasProps {
  style?: React.CSSProperties
}

function GradientCanvas({ style }: GradientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoverPosition, setHoverPosition] = useState<number | null>(null)
  const stateRef = useRef({
    colorStops: [] as ColorStop[],
    gradientType: 'linear' as GradientType,
    angle: 0,
    radialShape: 'circle' as RadialShape,
    ellipseScaleX: 1,
    ellipseScaleY: 1,
    hoverPosition: null as number | null,
  })

  const colorStops = useGradientStore((s) => s.colorStops)
  const gradientType = useGradientStore((s) => s.gradientType)
  const angle = useGradientStore((s) => s.angle)
  const radialShape = useGradientStore((s) => s.radialShape)
  const ellipseScaleX = useGradientStore((s) => s.ellipseScaleX)
  const ellipseScaleY = useGradientStore((s) => s.ellipseScaleY)

  useEffect(() => {
    stateRef.current = {
      colorStops,
      gradientType,
      angle,
      radialShape,
      ellipseScaleX,
      ellipseScaleY,
      hoverPosition,
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    animationRef.current = requestAnimationFrame(() => {
      render()
    })

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [colorStops, gradientType, angle, radialShape, ellipseScaleX, ellipseScaleY, hoverPosition])

  const render = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    const { colorStops, gradientType, angle, radialShape, ellipseScaleX, ellipseScaleY, hoverPosition } =
      stateRef.current

    if (colorStops.length === 0) return

    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position)

    let gradient: CanvasGradient

    if (gradientType === 'linear') {
      const angleRad = (angle * Math.PI) / 180
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const length = Math.sqrt(rect.width * rect.width + rect.height * rect.height)

      const x1 = centerX - Math.cos(angleRad) * (length / 2)
      const y1 = centerY - Math.sin(angleRad) * (length / 2)
      const x2 = centerX + Math.cos(angleRad) * (length / 2)
      const y2 = centerY + Math.sin(angleRad) * (length / 2)

      gradient = ctx.createLinearGradient(x1, y1, x2, y2)
    } else {
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      if (radialShape === 'circle') {
        const radius = Math.max(rect.width, rect.height) / 2
        gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
      } else {
        const radiusX = (rect.width * ellipseScaleX) / 2
        const radiusY = (rect.height * ellipseScaleY) / 2
        const maxRadius = Math.max(radiusX, radiusY)

        gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius)

        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.scale(ellipseScaleX, ellipseScaleY)
        ctx.translate(-centerX, -centerY)
      }
    }

    sortedStops.forEach((stop) => {
      gradient.addColorStop(Math.max(0, Math.min(1, stop.position / 100)), stop.color)
    })

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, rect.width, rect.height)

    if (gradientType === 'radial' && radialShape === 'ellipse') {
      ctx.restore()
    }

    if (gradientType === 'linear') {
      const indicatorY = rect.height - 20
      sortedStops.forEach((stop) => {
        const x = (stop.position / 100) * rect.width

        ctx.save()
        ctx.beginPath()
        ctx.moveTo(x, indicatorY)
        ctx.lineTo(x - 7, indicatorY - 12)
        ctx.lineTo(x + 7, indicatorY - 12)
        ctx.closePath()
        ctx.fillStyle = stop.color
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.arc(x, indicatorY + 8, 5, 0, Math.PI * 2)
        ctx.fillStyle = stop.color
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.restore()
      })
    } else {
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      sortedStops.forEach((stop) => {
        const radius = (stop.position / 100) * (Math.min(rect.width, rect.height) / 2 - 10)

        ctx.save()
        ctx.beginPath()
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx.strokeStyle = stop.color
        ctx.lineWidth = 2
        ctx.setLineDash([4, 4])
        ctx.stroke()
        ctx.restore()

        ctx.save()
        ctx.beginPath()
        ctx.arc(centerX + radius, centerY, 6, 0, Math.PI * 2)
        ctx.fillStyle = stop.color
        ctx.fill()
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.restore()
      })
    }

    if (hoverPosition !== null && gradientType === 'linear') {
      const x = (hoverPosition / 100) * rect.width

      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, rect.height)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.stroke()
      ctx.restore()

      const labelText = `${hoverPosition.toFixed(1)}%`
      ctx.save()
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif'
      const labelWidth = ctx.measureText(labelText).width
      const labelX = Math.max(5, Math.min(rect.width - labelWidth - 10, x - labelWidth / 2))

      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.beginPath()
      ctx.roundRect(labelX - 4, 8, labelWidth + 8, 20, 4)
      ctx.fill()

      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(labelText, labelX, 23)
      ctx.restore()
    }
  }

  useEffect(() => {
    const handleResize = () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      animationRef.current = requestAnimationFrame(() => render())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    let position = ((e.clientX - rect.left) / rect.width) * 100
    position = Math.max(0, Math.min(100, position))
    position = Math.round(position * 10) / 10
    setHoverPosition(position)
  }

  const handleMouseLeave = () => {
    setHoverPosition(null)
  }

  const canvasStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    borderRadius: '16px',
    border: '2px solid #E0E0E0',
    background: '#FAFAFA',
    display: 'block',
    cursor: 'crosshair',
    ...style,
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '80%',
        height: '400px',
        position: 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={canvasStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  )
}

export default GradientCanvas
