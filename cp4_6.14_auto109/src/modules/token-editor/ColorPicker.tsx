import React, { useState, useRef, useEffect, useCallback } from 'react'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return { h: 0, s: 0, v: 0 }
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  const v = max
  const d = max - min
  const s = max === 0 ? 0 : d / max

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s, v }
}

function hsvToHex(h: number, s: number, v: number): string {
  h = ((h % 360) + 360) % 360
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0

  if (h >= 0 && h < 60) { r = c; g = x; b = 0 }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0 }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x }

  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [hsv, setHsv] = useState(() => hexToHsv(color))
  const [hexInput, setHexInput] = useState(color)
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const saturationRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  const isDraggingSaturation = useRef(false)
  const isDraggingHue = useRef(false)

  useEffect(() => {
    const newHsv = hexToHsv(color)
    setHsv(newHsv)
    setHexInput(color)
  }, [color])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const updateFromSaturation = useCallback((clientX: number, clientY: number) => {
    if (!saturationRef.current) return
    const rect = saturationRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    const newS = x
    const newV = 1 - y
    setHsv((prev) => {
      const newHsv = { ...prev, s: newS, v: newV }
      const newHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v)
      onChange(newHex)
      return newHsv
    })
  }, [onChange])

  const updateFromHue = useCallback((clientX: number) => {
    if (!hueRef.current) return
    const rect = hueRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newH = x * 360
    setHsv((prev) => {
      const newHsv = { ...prev, h: newH }
      const newHex = hsvToHex(newHsv.h, newHsv.s, newHsv.v)
      onChange(newHex)
      return newHsv
    })
  }, [onChange])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSaturation.current) {
        updateFromSaturation(e.clientX, e.clientY)
      }
      if (isDraggingHue.current) {
        updateFromHue(e.clientX)
      }
    }
    const handleMouseUp = () => {
      isDraggingSaturation.current = false
      isDraggingHue.current = false
    }
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [updateFromSaturation, updateFromHue])

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setHexInput(val)
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      onChange(val)
    }
  }

  const hueBackground = hsvToHex(hsv.h, 1, 1)

  return (
    <div className="colorpicker-wrapper" ref={wrapperRef}>
      <div
        className="color-swatch"
        style={{ backgroundColor: color }}
        onClick={() => setIsOpen((o) => !o)}
      />
      {isOpen && (
        <div className="colorpicker-popover">
          <div
            ref={saturationRef}
            className="saturation-slider"
            style={{ backgroundColor: hueBackground }}
            onMouseDown={(e) => {
              isDraggingSaturation.current = true
              updateFromSaturation(e.clientX, e.clientY)
            }}
          >
            <div className="saturation-white" />
            <div className="saturation-black" />
            <div
              className="saturation-pointer"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%` }}
            />
          </div>
          <div
            ref={hueRef}
            className="hue-slider"
            onMouseDown={(e) => {
              isDraggingHue.current = true
              updateFromHue(e.clientX)
            }}
          >
            <div className="hue-pointer" style={{ left: `${(hsv.h / 360) * 100}%` }} />
          </div>
          <input
            className="hex-input"
            type="text"
            value={hexInput}
            onChange={handleHexChange}
            maxLength={7}
          />
        </div>
      )}
    </div>
  )
}

export default ColorPicker
