import { useEffect, useRef, useState, useCallback } from 'react'
import { useColorStore } from '../stores/colorStore'
import './ColorWheel.css'

const WHEEL_SIZE = 320
const PICKER_SIZE = 16

interface ColorWheelProps {
  size?: number
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase()
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { h: 0, s: 0, l: 0 }
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

export function ColorWheel({ size = WHEEL_SIZE }: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { currentColor, setCurrentColor, addToHistory } = useColorStore()
  const lastColorRef = useRef(currentColor)
  const addToHistoryRef = useRef(addToHistory)
  const setCurrentColorRef = useRef(setCurrentColor)
  const sizeRef = useRef(size)

  const [pickerPos, setPickerPos] = useState(() => {
    const hsl = hexToHsl(currentColor)
    const angle = (hsl.h * Math.PI) / 180
    const distance = (hsl.s / 100) * (size / 2 - PICKER_SIZE / 2)
    return {
      x: size / 2 + Math.cos(angle) * distance,
      y: size / 2 + Math.sin(angle) * distance,
    }
  })

  useEffect(() => {
    addToHistoryRef.current = addToHistory
    setCurrentColorRef.current = setCurrentColor
    sizeRef.current = size
  }, [addToHistory, setCurrentColor, size])

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const centerX = size / 2
    const centerY = size / 2
    const radius = size / 2
    const imageData = ctx.createImageData(size, size)
    const data = imageData.data
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - centerX
        const dy = y - centerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const idx = (y * size + x) * 4
        if (dist <= radius) {
          const angle = Math.atan2(dy, dx)
          const hue = ((angle * 180) / Math.PI + 360) % 360
          const sat = (dist / radius) * 100
          const hex = hslToHex(hue, sat, 50)
          const r = parseInt(hex.slice(1, 3), 16)
          const g = parseInt(hex.slice(3, 5), 16)
          const b = parseInt(hex.slice(5, 7), 16)
          data[idx] = r
          data[idx + 1] = g
          data[idx + 2] = b
          data[idx + 3] = 255
        } else {
          data[idx] = 0
          data[idx + 1] = 0
          data[idx + 2] = 0
          data[idx + 3] = 0
        }
      }
    }
    ctx.putImageData(imageData, 0, 0)
  }, [size])

  useEffect(() => {
    drawWheel()
  }, [drawWheel])

  const getColorFromPosition = useCallback(
    (x: number, y: number, wheelSize: number) => {
      const centerX = wheelSize / 2
      const centerY = wheelSize / 2
      const dx = x - centerX
      const dy = y - centerY
      const distance = Math.sqrt(dx * dx + dy * dy)
      const maxDist = wheelSize / 2
      const clampedDist = Math.min(distance, maxDist)
      const angle = Math.atan2(dy, dx)
      const hue = ((angle * 180) / Math.PI + 360) % 360
      const sat = (clampedDist / maxDist) * 100
      const hex = hslToHex(hue, sat, 50)
      return {
        hex, angle, distance: clampedDist, centerX, centerY, angleRad: angle }
    },
    []
  )

  const updatePickerAndColor = useCallback((x: number, y: number) => {
    const wheelSize = sizeRef.current
    const { hex, angle, distance, centerX, centerY } = getColorFromPosition(x, y, wheelSize)
    setPickerPos({
      x: centerX + Math.cos(angle) * distance,
      y: centerY + Math.sin(angle) * distance,
    })
    if (hex !== lastColorRef.current) {
      setCurrentColorRef.current(hex)
      lastColorRef.current = hex
    }
  }, [getColorFromPosition])

  const handlePointerDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(true)
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      updatePickerAndColor(x, y)
    },
    [updatePickerAndColor]
  )

  useEffect(() => {
    if (!isDragging) return

    let rafId: number
    let pendingX: number | null = null
    let pendingY: number | null = null
    let hasNewPosition = false

    const updateFrame = () => {
      if (hasNewPosition && pendingX !== null && pendingY !== null) {
        updatePickerAndColor(pendingX, pendingY)
        hasNewPosition = false
      }
      rafId = requestAnimationFrame(updateFrame)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const wheel = wheelRef.current
      if (!wheel) return
      const rect = wheel.getBoundingClientRect()
      pendingX = e.clientX - rect.left
      pendingY = e.clientY - rect.top
      hasNewPosition = true
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      addToHistoryRef.current(lastColorRef.current)
    }

    rafId = requestAnimationFrame(updateFrame)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, updatePickerAndColor])

  return (
    <div className="color-wheel-wrapper">
      <div
        ref={wheelRef}
        className="color-wheel-container"
        style={{ width: size, height: size }}
        onMouseDown={handlePointerDown}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="color-wheel-canvas"
        />
        <div
          className={`color-picker ${isDragging ? 'dragging' : ''}`}
          style={{
            width: PICKER_SIZE,
            height: PICKER_SIZE,
            left: pickerPos.x - PICKER_SIZE / 2,
            top: pickerPos.y - PICKER_SIZE / 2,
          }}
        />
      </div>
      <div className="color-preview-container">
        <div
          className="color-preview-block"
          style={{ backgroundColor: currentColor }}
        />
        <div className="color-preview-text">{currentColor.toUpperCase()}</div>
      </div>
    </div>
  )
}

export default ColorWheel
