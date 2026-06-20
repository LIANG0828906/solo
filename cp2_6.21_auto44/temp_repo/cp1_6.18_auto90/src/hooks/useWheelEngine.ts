import { useState, useCallback, useRef, useEffect } from 'react'
import { useAppStore, type FlavorDimension } from '@/stores/appStore'

export interface DimensionConfig {
  dimension: FlavorDimension
  name: string
  color: string
  startAngle: number
  endAngle: number
}

export const DIMENSION_CONFIGS: DimensionConfig[] = [
  { dimension: 'sweet', name: '甜', color: '#FF9F43', startAngle: -120, endAngle: -60 },
  { dimension: 'sour', name: '酸', color: '#EE5A24', startAngle: -60, endAngle: 0 },
  { dimension: 'bitter', name: '苦', color: '#6C5CE7', startAngle: 0, endAngle: 60 },
  { dimension: 'spicy', name: '辣', color: '#FD79A8', startAngle: 60, endAngle: 120 },
  { dimension: 'salty', name: '咸', color: '#00CEC9', startAngle: 120, endAngle: 180 },
  { dimension: 'umami', name: '鲜', color: '#FDCB6E', startAngle: -180, endAngle: -120 },
]

export interface Point {
  x: number
  y: number
}

export const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number): Point => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}

export const angleToValue = (angle: number, startAngle: number, endAngle: number): number => {
  const normalizedAngle = ((angle - startAngle) % 360 + 360) % 360
  const range = ((endAngle - startAngle) % 360 + 360) % 360
  const ratio = Math.min(1, Math.max(0, normalizedAngle / range))
  return Math.round(ratio * 9 * 10) / 10
}

export const valueToAngle = (value: number, startAngle: number, endAngle: number): number => {
  const range = ((endAngle - startAngle) % 360 + 360) % 360
  const ratio = Math.min(1, Math.max(0, value / 9))
  return startAngle + ratio * range
}

interface UseWheelEngineProps {
  canvasRef: React.RefObject<HTMLCanvasElement>
  size: number
}

interface UseWheelEngineReturn {
  pointerPositions: Record<FlavorDimension, number>
  draggingDimension: FlavorDimension | null
  hoveredDimension: FlavorDimension | null
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerUp: () => void
  handleCanvasMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void
}

export const useWheelEngine = ({ canvasRef, size }: UseWheelEngineProps): UseWheelEngineReturn => {
  const setWheelValue = useAppStore((state) => state.setWheelValue)
  const currentWheel = useAppStore((state) => state.currentWheel)

  const [pointerPositions, setPointerPositions] = useState<Record<FlavorDimension, number>>(() => {
    const positions = {} as Record<FlavorDimension, number>
    DIMENSION_CONFIGS.forEach((config) => {
      positions[config.dimension] = valueToAngle(currentWheel[config.dimension], config.startAngle, config.endAngle)
    })
    return positions
  })

  const [draggingDimension, setDraggingDimension] = useState<FlavorDimension | null>(null)
  const [hoveredDimension, setHoveredDimension] = useState<FlavorDimension | null>(null)
  const isDraggingRef = useRef(false)

  useEffect(() => {
    setPointerPositions((prev) => {
      const updated = { ...prev }
      DIMENSION_CONFIGS.forEach((config) => {
        updated[config.dimension] = valueToAngle(currentWheel[config.dimension], config.startAngle, config.endAngle)
      })
      return updated
    })
  }, [currentWheel])

  const getMousePosition = useCallback(
    (clientX: number, clientY: number): Point => {
      if (!canvasRef.current) return { x: 0, y: 0 }
      const rect = canvasRef.current.getBoundingClientRect()
      const scaleX = size / rect.width
      const scaleY = size / rect.height
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      }
    },
    [canvasRef, size]
  )

  const getAngleFromPoint = useCallback((point: Point, center: Point): number => {
    const dx = point.x - center.x
    const dy = point.y - center.y
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90
    if (angle > 180) angle -= 360
    if (angle < -180) angle += 360
    return angle
  }, [])

  const getDimensionAtPoint = useCallback(
    (point: Point): FlavorDimension | null => {
      const center = { x: size / 2, y: size / 2 }
      const dx = point.x - center.x
      const dy = point.y - center.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const minRadius = size * 0.3
      const maxRadius = size * 0.48

      if (distance < minRadius || distance > maxRadius + 20) return null

      const angle = getAngleFromPoint(point, center)

      for (const config of DIMENSION_CONFIGS) {
        let normalizedAngle = angle
        let start = config.startAngle
        let end = config.endAngle

        if (start > end) {
          if (normalizedAngle < 0) normalizedAngle += 360
          end += 360
        }

        if (normalizedAngle >= start && normalizedAngle <= end) {
          return config.dimension
        }
      }
      return null
    },
    [size, getAngleFromPoint]
  )

  const getPointerAtPoint = useCallback(
    (point: Point): FlavorDimension | null => {
      const center = { x: size / 2, y: size / 2 }
      const pointerRadius = size * 0.42
      const hitRadius = 16

      for (const config of DIMENSION_CONFIGS) {
        const angle = pointerPositions[config.dimension]
        const pointerPos = polarToCartesian(center.x, center.y, pointerRadius, angle)
        const dx = point.x - pointerPos.x
        const dy = point.y - pointerPos.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance <= hitRadius) {
          return config.dimension
        }
      }
      return null
    },
    [size, pointerPositions]
  )

  const clampAngleToDimension = useCallback((angle: number, config: DimensionConfig): number => {
    let normalizedAngle = angle
    let start = config.startAngle
    let end = config.endAngle

    if (start > end) {
      if (normalizedAngle < 0) normalizedAngle += 360
      start += 360
      end += 360
    }

    const clamped = Math.max(start, Math.min(end, normalizedAngle))
    return clamped > 180 ? clamped - 360 : clamped
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const point = getMousePosition(e.clientX, e.clientY)
      const pointerDim = getPointerAtPoint(point)
      const dimAtPoint = getDimensionAtPoint(point)

      if (pointerDim) {
        setDraggingDimension(pointerDim)
        isDraggingRef.current = true
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      } else if (dimAtPoint) {
        const config = DIMENSION_CONFIGS.find((c) => c.dimension === dimAtPoint)!
        const center = { x: size / 2, y: size / 2 }
        const angle = getAngleFromPoint(point, center)
        const clampedAngle = clampAngleToDimension(angle, config)
        const value = angleToValue(clampedAngle, config.startAngle, config.endAngle)
        setWheelValue(dimAtPoint, value)
      }
    },
    [getMousePosition, getPointerAtPoint, getDimensionAtPoint, size, getAngleFromPoint, clampAngleToDimension, setWheelValue]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!draggingDimension || !isDraggingRef.current) return

      const point = getMousePosition(e.clientX, e.clientY)
      const center = { x: size / 2, y: size / 2 }
      const angle = getAngleFromPoint(point, center)
      const config = DIMENSION_CONFIGS.find((c) => c.dimension === draggingDimension)!
      const clampedAngle = clampAngleToDimension(angle, config)
      const value = angleToValue(clampedAngle, config.startAngle, config.endAngle)

      setWheelValue(draggingDimension, value)
    },
    [draggingDimension, getMousePosition, size, getAngleFromPoint, clampAngleToDimension, setWheelValue]
  )

  const onPointerUp = useCallback(() => {
    setDraggingDimension(null)
    isDraggingRef.current = false
  }, [])

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isDraggingRef.current) return

      const point = getMousePosition(e.clientX, e.clientY)
      const pointerDim = getPointerAtPoint(point)
      const dimAtPoint = getDimensionAtPoint(point)

      if (pointerDim) {
        setHoveredDimension(pointerDim)
      } else if (dimAtPoint) {
        setHoveredDimension(dimAtPoint)
      } else {
        setHoveredDimension(null)
      }
    },
    [getMousePosition, getPointerAtPoint, getDimensionAtPoint]
  )

  return {
    pointerPositions,
    draggingDimension,
    hoveredDimension,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    handleCanvasMouseMove,
  }
}
