import { useEffect, useRef } from 'react'
import { useGradientStore, ColorStop, GradientType, RadialShape } from '../stores/gradientStore'

interface GradientCanvasProps {
  style?: React.CSSProperties
}

function GradientCanvas({ style }: GradientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const stateRef = useRef({
    colorStops: [] as ColorStop[],
    gradientType: 'linear' as GradientType,
    angle: 0,
    radialShape: 'circle' as RadialShape,
    ellipseScaleX: 1,
    ellipseScaleY: 1,
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
  }, [colorStops, gradientType, angle, radialShape, ellipseScaleX, ellipseScaleY])

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

    const { colorStops, gradientType, angle, radialShape, ellipseScaleX, ellipseScaleY } =
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

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '80%',
        height: '400px',
        borderRadius: '16px',
        border: '2px solid #E0E0E0',
        background: '#FAFAFA',
        display: 'block',
        ...style,
      }}
    />
  )
}

export default GradientCanvas
