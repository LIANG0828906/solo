import { useRef, useEffect, useState, useCallback } from 'react'
import { hexToHsl, hslToHex } from '../utils/colorUtils'

interface ColorWheelProps {
  color: string
  onChange: (hex: string) => void
  size?: number
}

export default function ColorWheel({ color, onChange, size = 280 }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const animationRef = useRef<number | null>(null)
  const pendingPos = useRef<{ x: number; y: number } | null>(null)

  const center = size / 2
  const radius = size / 2 - 10

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, size, size)

    const imageData = ctx.createImageData(size, size)
    const data = imageData.data

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - center
        const dy = y - center
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist <= radius) {
          let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90
          if (angle < 0) angle += 360
          const sat = Math.min(100, (dist / radius) * 100)

          const { r, g, b } = hslToRgbInternal(angle, sat, 50)

          const i = (y * size + x) * 4
          data[i] = r
          data[i + 1] = g
          data[i + 2] = b
          data[i + 3] = 255
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)

    const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)')
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalCompositeOperation = 'source-over'
  }, [size, center, radius])

  function hslToRgbInternal(h: number, s: number, l: number) {
    h = h / 360
    s = s / 100
    l = l / 100

    let r, g, b

    if (s === 0) {
      r = g = b = l
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    }
  }

  const drawSelector = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const hsl = hexToHsl(color)
    const angle = hsl.h - 90
    const r = (hsl.s / 100) * radius
    const rad = angle * Math.PI / 180
    const x = center + r * Math.cos(rad)
    const y = center + r * Math.sin(rad)

    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 8
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(x, y, 12, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, 10, 0, Math.PI * 2)
    ctx.fill()
  }, [color, center, radius])

  const getColorFromPosition = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    const scaleX = size / rect.width
    const scaleY = size / rect.height
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    const dx = x - center
    const dy = y - center
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > radius) return null

    let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90
    if (angle < 0) angle += 360
    if (angle >= 360) angle -= 360

    const sat = Math.min(100, (distance / radius) * 100)
    return hslToHex(angle, sat, 50)
  }, [size, center, radius])

  const updateColor = useCallback((clientX: number, clientY: number) => {
    const newColor = getColorFromPosition(clientX, clientY)
    if (newColor) {
      onChange(newColor)
    }
  }, [getColorFromPosition, onChange])

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const newColor = getColorFromPosition(e.clientX, e.clientY)
    if (newColor) {
      setIsDragging(true)
      onChange(newColor)
    }
  }, [getColorFromPosition, onChange])

  const handleCanvasTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0]
      const newColor = getColorFromPosition(touch.clientX, touch.clientY)
      if (newColor) {
        e.preventDefault()
        setIsDragging(true)
        onChange(newColor)
      }
    }
  }, [getColorFromPosition, onChange])

  useEffect(() => {
    if (!isDragging) return

    let needsUpdate = false

    const render = () => {
      if (needsUpdate && pendingPos.current) {
        updateColor(pendingPos.current.x, pendingPos.current.y)
        needsUpdate = false
      }
      animationRef.current = requestAnimationFrame(render)
    }

    const handleMouseMove = (e: MouseEvent) => {
      pendingPos.current = { x: e.clientX, y: e.clientY }
      needsUpdate = true
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0]
        pendingPos.current = { x: touch.clientX, y: touch.clientY }
        needsUpdate = true
      }
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('touchcancel', handleTouchEnd)

    animationRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('touchcancel', handleTouchEnd)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isDragging, updateColor])

  useEffect(() => {
    drawWheel()
    drawSelector()
  }, [drawWheel, drawSelector])

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        backgroundColor: 'transparent',
      }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onMouseDown={handleCanvasMouseDown}
        onTouchStart={handleCanvasTouchStart}
        style={{
          width: size,
          height: size,
          filter: 'drop-shadow(0 8px 32px rgba(0, 0, 0, 0.4))',
          display: 'block',
          borderRadius: '50%',
          backgroundColor: '#1a1a2e',
        }}
      />
    </div>
  )
}
