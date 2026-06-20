import { useRef, useEffect, useCallback, memo } from 'react'
import { useAppStore } from '@/stores/appStore'
import { useWheelEngine, DIMENSION_CONFIGS, polarToCartesian, type DimensionConfig } from '@/hooks/useWheelEngine'

const CANVAS_SIZE = 320
const POINTER_RADIUS = 6

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

interface WheelCanvasProps {
  size?: number
}

export const WheelCanvas = memo(function WheelCanvas({ size = CANVAS_SIZE }: WheelCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const currentWheel = useAppStore((state) => state.currentWheel)

  const {
    pointerPositions,
    draggingDimension,
    hoveredDimension,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    handleCanvasMouseMove,
  } = useWheelEngine({ canvasRef, size })

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = size / 2
    const centerY = size / 2
    const outerRadius = size * 0.45
    const innerRadius = size * 0.3
    const pointerRadius = size * 0.42

    ctx.clearRect(0, 0, size, size)

    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size / 2)
    bgGradient.addColorStop(0, '#2D2D44')
    bgGradient.addColorStop(1, '#1A1A2E')
    ctx.fillStyle = bgGradient
    ctx.beginPath()
    ctx.arc(centerX, centerY, size / 2, 0, Math.PI * 2)
    ctx.fill()

    DIMENSION_CONFIGS.forEach((config: DimensionConfig) => {
      const isHovered = hoveredDimension === config.dimension
      const scale = isHovered ? 1.05 : 1
      const adjustedOuterRadius = outerRadius * scale
      const adjustedInnerRadius = innerRadius * scale

      const startRad = ((config.startAngle - 90) * Math.PI) / 180
      const endRad = ((config.endAngle - 90) * Math.PI) / 180

      const sectorGradient = ctx.createRadialGradient(
        centerX, centerY, adjustedInnerRadius,
        centerX, centerY, adjustedOuterRadius
      )
      sectorGradient.addColorStop(0, hexToRgba(config.color, 0.1))
      sectorGradient.addColorStop(1, hexToRgba(config.color, 0.6))

      ctx.beginPath()
      ctx.arc(centerX, centerY, adjustedOuterRadius, startRad, endRad)
      ctx.arc(centerX, centerY, adjustedInnerRadius, endRad, startRad, true)
      ctx.closePath()
      ctx.fillStyle = sectorGradient
      ctx.fill()

      if (isHovered) {
        ctx.shadowColor = config.color
        ctx.shadowBlur = 20
        ctx.fill()
        ctx.shadowBlur = 0
      }
    })

    DIMENSION_CONFIGS.forEach((config: DimensionConfig) => {
      const startRad = ((config.startAngle - 90) * Math.PI) / 180
      const endRad = ((config.endAngle - 90) * Math.PI) / 180

      const drawDivider = (angleRad: number) => {
        const inner = polarToCartesian(centerX, centerY, innerRadius * 0.95, (angleRad * 180) / Math.PI + 90)
        const outer = polarToCartesian(centerX, centerY, outerRadius * 1.05, (angleRad * 180) / Math.PI + 90)
        ctx.beginPath()
        ctx.moveTo(inner.x, inner.y)
        ctx.lineTo(outer.x, outer.y)
        ctx.strokeStyle = '#4A4A6A'
        ctx.lineWidth = 1
        ctx.stroke()
      }

      drawDivider(startRad)
      drawDivider(endRad)
    })

    const markCount = 10
    for (let i = 0; i <= markCount; i++) {
      const ratio = i / markCount
      const markRadius = innerRadius + (outerRadius - innerRadius) * ratio

      ctx.beginPath()
      ctx.arc(centerX, centerY, markRadius, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 0.5
      ctx.stroke()

      if (i % 3 === 0 && i > 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
        ctx.font = `${size * 0.03}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        const value = Math.round((i / markCount) * 9)
        const pos = polarToCartesian(centerX, centerY, markRadius - size * 0.025, -135)
        ctx.fillText(value.toString(), pos.x, pos.y)
      }
    }

    DIMENSION_CONFIGS.forEach((config: DimensionConfig) => {
      const angle = pointerPositions[config.dimension]
      const pointerPos = polarToCartesian(centerX, centerY, pointerRadius, angle)
      const isDragging = draggingDimension === config.dimension
      const isHovered = hoveredDimension === config.dimension
      const pointerSize = isDragging || isHovered ? POINTER_RADIUS * 1.2 : POINTER_RADIUS

      const startPos = polarToCartesian(centerX, centerY, innerRadius + 5, angle)

      ctx.beginPath()
      ctx.moveTo(startPos.x, startPos.y)
      ctx.lineTo(pointerPos.x, pointerPos.y)
      ctx.strokeStyle = config.color
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(pointerPos.x, pointerPos.y, pointerSize, 0, Math.PI * 2)
      ctx.fillStyle = config.color
      ctx.fill()

      if (isDragging || isHovered) {
        ctx.shadowColor = config.color
        ctx.shadowBlur = 15
        ctx.fill()
        ctx.shadowBlur = 0

        ctx.beginPath()
        ctx.arc(pointerPos.x, pointerPos.y, pointerSize + 4, 0, Math.PI * 2)
        ctx.strokeStyle = hexToRgba(config.color, 0.3)
        ctx.lineWidth = 2
        ctx.stroke()
      }

      ctx.beginPath()
      ctx.arc(pointerPos.x, pointerPos.y, pointerSize * 0.4, 0, Math.PI * 2)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
    })

    DIMENSION_CONFIGS.forEach((config: DimensionConfig) => {
      const isHovered = hoveredDimension === config.dimension
      if (!isHovered) return

      const midAngle = (config.startAngle + config.endAngle) / 2
      const labelRadius = outerRadius + size * 0.08
      const labelPos = polarToCartesian(centerX, centerY, labelRadius, midAngle)

      ctx.font = `bold ${size * 0.05}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = config.color
      ctx.shadowColor = config.color
      ctx.shadowBlur = 10
      ctx.fillText(config.name, labelPos.x, labelPos.y)
      ctx.shadowBlur = 0

      const value = currentWheel[config.dimension]
      ctx.font = `${size * 0.035}px sans-serif`
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(value.toFixed(1), labelPos.x, labelPos.y + size * 0.06)
    })
  }, [size, pointerPositions, draggingDimension, hoveredDimension, currentWheel])

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
        borderRadius: '50%',
        cursor: draggingDimension ? 'grabbing' : hoveredDimension ? 'pointer' : 'default',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onMouseMove={handleCanvasMouseMove}
    />
  )
})
