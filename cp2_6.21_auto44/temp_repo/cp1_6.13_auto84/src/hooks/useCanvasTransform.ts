import { useState, useCallback, useRef } from 'react'
import { CanvasTransform } from '@/types'

const MIN_SCALE = 0.5
const MAX_SCALE = 3.0
const SCALE_STEP = 0.1

export function useCanvasTransform() {
  const [transform, setTransform] = useState<CanvasTransform>({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
  })

  const isDragging = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP
    
    setTransform((prev) => ({
      ...prev,
      scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale + delta)),
    }))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return

    const dx = e.clientX - lastMousePos.current.x
    const dy = e.clientY - lastMousePos.current.y

    setTransform((prev) => ({
      ...prev,
      offsetX: prev.offsetX + dx,
      offsetY: prev.offsetY + dy,
    }))

    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
  }, [])

  const resetTransform = useCallback(() => {
    setTransform({ scale: 1.0, offsetX: 0, offsetY: 0 })
  }, [])

  return {
    transform,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetTransform,
    isDragging: isDragging.current,
  }
}
