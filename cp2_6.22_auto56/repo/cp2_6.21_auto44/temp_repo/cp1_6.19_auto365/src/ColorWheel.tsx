import { useRef, useCallback, useEffect, useMemo } from 'react'
import { useColorStore } from './store'
import { hslToHex } from './utils/colorUtils'

const WHEEL_RADIUS = 120
const POINTER_RADIUS = 12

export default function ColorWheel() {
  const hue = useColorStore((state) => state.hue)
  const saturation = useColorStore((state) => state.saturation)
  const lightness = useColorStore((state) => state.lightness)
  const setHue = useColorStore((state) => state.setHue)
  const setSaturation = useColorStore((state) => state.setSaturation)

  const wheelRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragMode = useRef<'hue' | 'sat' | null>(null)

  const pointerPosition = useMemo(() => {
    const angle = (hue * Math.PI) / 180
    const radius = (saturation / 100) * WHEEL_RADIUS
    return {
      x: WHEEL_RADIUS + Math.cos(angle) * radius,
      y: WHEEL_RADIUS + Math.sin(angle) * radius
    }
  }, [hue, saturation])

  const handlePosition = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current) return
    const rect = wheelRef.current.getBoundingClientRect()
    const x = clientX - rect.left - WHEEL_RADIUS
    const y = clientY - rect.top - WHEEL_RADIUS
    const distance = Math.sqrt(x * x + y * y)
    let angle = Math.atan2(y, x) * (180 / Math.PI)
    if (angle < 0) angle += 360

    if (dragMode.current === 'hue' || distance > WHEEL_RADIUS - 20) {
      setHue(Math.round(angle))
    } else {
      const sat = Math.min(100, Math.max(0, (distance / WHEEL_RADIUS) * 100))
      setSaturation(Math.round(sat))
      setHue(Math.round(angle))
    }
  }, [setHue, setSaturation])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    const rect = wheelRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left - WHEEL_RADIUS
    const y = e.clientY - rect.top - WHEEL_RADIUS
    const distance = Math.sqrt(x * x + y * y)

    if (distance > WHEEL_RADIUS - 20) {
      dragMode.current = 'hue'
    } else {
      dragMode.current = 'sat'
    }
    handlePosition(e.clientX, e.clientY)
  }, [handlePosition])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    handlePosition(e.clientX, e.clientY)
  }, [handlePosition])

  const handleMouseUp = useCallback(() => {
    isDragging.current = false
    dragMode.current = null
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true
    const touch = e.touches[0]
    handlePosition(touch.clientX, touch.clientY)
  }, [handlePosition])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return
    const touch = e.touches[0]
    handlePosition(touch.clientX, touch.clientY)
  }, [handlePosition])

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const centerColor = hslToHex({ h: hue, s: saturation / 100, l: lightness / 100 })
  const satGradientOpacity = 1 - Math.abs((lightness / 100) * 2 - 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div
        ref={wheelRef}
        style={{
          position: 'relative',
          width: WHEEL_RADIUS * 2,
          height: WHEEL_RADIUS * 2,
          borderRadius: '50%',
          background: `conic-gradient(from 0deg, 
            hsl(0, 100%, 50%), 
            hsl(60, 100%, 50%), 
            hsl(120, 100%, 50%), 
            hsl(180, 100%, 50%), 
            hsl(240, 100%, 50%), 
            hsl(300, 100%, 50%), 
            hsl(360, 100%, 50%)
          )`,
          cursor: 'crosshair',
          touchAction: 'none'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(0,0,0,0) 0%, rgba(0,0,0,${satGradientOpacity * 0.6}) 100%)`,
            pointerEvents: 'none'
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: pointerPosition.x - POINTER_RADIUS,
            top: pointerPosition.y - POINTER_RADIUS,
            width: POINTER_RADIUS * 2,
            height: POINTER_RADIUS * 2,
            borderRadius: '50%',
            backgroundColor: centerColor,
            border: '2px solid #ffffff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            zIndex: 10
          }}
        />
      </div>

      <div
        style={{
          width: WHEEL_RADIUS * 2,
          height: 32,
          borderRadius: 8,
          backgroundColor: centerColor,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: lightness > 50 ? '#000' : '#fff',
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'monospace',
          letterSpacing: 1
        }}
      >
        {centerColor}
      </div>
    </div>
  )
}
