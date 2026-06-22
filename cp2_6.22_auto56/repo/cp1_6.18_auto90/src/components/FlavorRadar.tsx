import { useRef, useEffect, useCallback, memo } from 'react'
import { useAppStore, type FlavorDimension, type FlavorWheel } from '@/stores/appStore'
import { DIMENSION_CONFIGS, polarToCartesian } from '@/hooks/useWheelEngine'

const CANVAS_SIZE = 320

const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t
}

const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3)
}

interface FlavorRadarProps {
  size?: number
  data?: FlavorWheel
}

export const FlavorRadar = memo(function FlavorRadar({ size = CANVAS_SIZE, data }: FlavorRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const storeWheel = useAppStore((state) => state.currentWheel)
  const currentWheel = data ?? storeWheel
  const animatedValuesRef = useRef<Record<FlavorDimension, number>>({
    sweet: 0,
    sour: 0,
    bitter: 0,
    spicy: 0,
    salty: 0,
    umami: 0,
  })
  const targetValuesRef = useRef<Record<FlavorDimension, number>>({ ...currentWheel })
  const animationStartTimeRef = useRef<number>(0)
  const isAnimatingRef = useRef<boolean>(false)
  const ANIMATION_DURATION = 300

  useEffect(() => {
    targetValuesRef.current = { ...currentWheel }
    animationStartTimeRef.current = performance.now()
    isAnimatingRef.current = true
  }, [currentWheel])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = size / 2
    const centerY = size / 2
    const maxRadius = size * 0.4
    const gridLayers = 3

    ctx.clearRect(0, 0, size, size)

    if (isAnimatingRef.current) {
      const elapsed = performance.now() - animationStartTimeRef.current
      const progress = Math.min(1, elapsed / ANIMATION_DURATION)
      const easedProgress = easeOutCubic(progress)

      DIMENSION_CONFIGS.forEach((config) => {
        const startValue = animatedValuesRef.current[config.dimension]
        const endValue = targetValuesRef.current[config.dimension]
        animatedValuesRef.current[config.dimension] = lerp(startValue, endValue, easedProgress)
      })

      if (progress >= 1) {
        isAnimatingRef.current = false
        DIMENSION_CONFIGS.forEach((config) => {
          animatedValuesRef.current[config.dimension] = targetValuesRef.current[config.dimension]
        })
      }
    }

    for (let layer = 1; layer <= gridLayers; layer++) {
      const layerRadius = (maxRadius * layer) / gridLayers
      ctx.beginPath()

      DIMENSION_CONFIGS.forEach((config, index) => {
        const angle = (config.startAngle + config.endAngle) / 2
        const point = polarToCartesian(centerX, centerY, layerRadius, angle)

        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })

      ctx.closePath()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
      ctx.lineWidth = 1
      ctx.stroke()
    }

    DIMENSION_CONFIGS.forEach((config) => {
      const angle = (config.startAngle + config.endAngle) / 2
      const outerPoint = polarToCartesian(centerX, centerY, maxRadius * 1.1, angle)

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(outerPoint.x, outerPoint.y)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 1
      ctx.stroke()

      const labelPoint = polarToCartesian(centerX, centerY, maxRadius * 1.25, angle)
      ctx.font = `${size * 0.04}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = config.color
      ctx.fillText(config.name, labelPoint.x, labelPoint.y)
    })

    ctx.beginPath()
    DIMENSION_CONFIGS.forEach((config, index) => {
      const value = animatedValuesRef.current[config.dimension]
      const ratio = value / 9
      const angle = (config.startAngle + config.endAngle) / 2
      const pointRadius = maxRadius * ratio
      const point = polarToCartesian(centerX, centerY, pointRadius, angle)

      if (index === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })
    ctx.closePath()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 255, 1)'
    ctx.lineWidth = 2
    ctx.stroke()

    DIMENSION_CONFIGS.forEach((config) => {
      const value = animatedValuesRef.current[config.dimension]
      const ratio = value / 9
      const angle = (config.startAngle + config.endAngle) / 2
      const pointRadius = maxRadius * ratio
      const point = polarToCartesian(centerX, centerY, pointRadius, angle)

      ctx.beginPath()
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2)
      ctx.fillStyle = config.color
      ctx.fill()

      ctx.beginPath()
      ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
    })
  }, [size])

  useEffect(() => {
    const animate = () => {
      draw()
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
      }}
    />
  )
})

export default FlavorRadar
