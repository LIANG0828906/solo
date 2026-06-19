import React, { useRef, useCallback, useMemo } from 'react'
import { hsl } from 'd3-color'
import type { ColorData } from '../types'
import { isValidHex, hexToColorData, rgbToHex } from '../utils/colorHarmony'

interface ColorPickerProps {
  color: ColorData
  onChange: (color: ColorData) => void
  onAddColor: (color: ColorData) => void
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onAddColor }) => {
  const hueRef = useRef<HTMLDivElement>(null)
  const svRef = useRef<HTMLDivElement>(null)
  const isDraggingHue = useRef(false)
  const isDraggingSV = useRef(false)

  const huePosition = useMemo(() => {
    const angle = color.hsl.h
    const radius = 100
    const rad = ((angle - 90) * Math.PI) / 180
    return {
      x: 120 + radius * Math.cos(rad),
      y: 120 + radius * Math.sin(rad)
    }
  }, [color.hsl.h])

  const svPosition = useMemo(() => {
    return {
      x: (color.hsl.s / 100) * 240,
      y: ((100 - color.hsl.l) / 100) * 240
    }
  }, [color.hsl.s, color.hsl.l])

  const hueColor = useMemo(() => {
    return hsl(color.hsl.h, 1, 0.5).hex()
  }, [color.hsl.h])

  const updateFromHue = useCallback(
    (clientX: number, clientY: number) => {
      if (!hueRef.current) return
      const rect = hueRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const x = clientX - centerX
      const y = clientY - centerY
      let angle = (Math.atan2(y, x) * 180) / Math.PI + 90
      if (angle < 0) angle += 360
      const newColor = hexToColorData(
        hsl(angle, color.hsl.s / 100, color.hsl.l / 100).hex()
      )
      onChange(newColor)
    },
    [color.hsl.s, color.hsl.l, onChange]
  )

  const updateFromSV = useCallback(
    (clientX: number, clientY: number) => {
      if (!svRef.current) return
      const rect = svRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(240, clientX - rect.left))
      const y = Math.max(0, Math.min(240, clientY - rect.top))
      const s = (x / 240) * 100
      const l = 100 - (y / 240) * 100
      const newColor = hexToColorData(hsl(color.hsl.h, s / 100, l / 100).hex())
      onChange(newColor)
    },
    [color.hsl.h, onChange]
  )

  const handleHueMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingHue.current = true
      updateFromHue(e.clientX, e.clientY)
    },
    [updateFromHue]
  )

  const handleSVMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingSV.current = true
      updateFromSV(e.clientX, e.clientY)
    },
    [updateFromSV]
  )

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingHue.current) {
        updateFromHue(e.clientX, e.clientY)
      }
      if (isDraggingSV.current) {
        updateFromSV(e.clientX, e.clientY)
      }
    }

    const handleMouseUp = () => {
      isDraggingHue.current = false
      isDraggingSV.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [updateFromHue, updateFromSV])

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (isValidHex(value)) {
      const hex = value.startsWith('#') ? value : '#' + value
      onChange(hexToColorData(hex))
    }
  }

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const numValue = parseInt(value, 10)
    if (isNaN(numValue) || numValue < 0 || numValue > 255) return
    const newRgb = { ...color.rgb, [channel]: numValue }
    onChange(hexToColorData(rgbToHex(newRgb.r, newRgb.g, newRgb.b)))
  }

  return (
    <div className="picker-section">
      <div className="color-picker-container">
        <div
          ref={hueRef}
          className="hue-ring"
          onMouseDown={handleHueMouseDown}
        >
          <div
            className="hue-handle"
            style={{
              left: huePosition.x,
              top: huePosition.y,
              backgroundColor: hueColor
            }}
          />
        </div>

        <div
          ref={svRef}
          className="sv-panel"
          style={{ backgroundColor: hueColor }}
          onMouseDown={handleSVMouseDown}
        >
          <div
            className="sv-handle"
            style={{
              left: svPosition.x,
              top: svPosition.y,
              backgroundColor: color.hex
            }}
          />
        </div>
      </div>

      <div className="glass color-values">
        <div
          className="color-preview"
          style={{ backgroundColor: color.hex }}
        />
        <div className="input-group">
          <label>HEX</label>
          <input
            type="text"
            value={color.hex}
            onChange={handleHexChange}
            maxLength={7}
          />
        </div>
        <div className="input-group">
          <label>RGB</label>
          <div className="rgb-inputs">
            <div className="input-group">
              <input
                type="number"
                value={color.rgb.r}
                onChange={(e) => handleRgbChange('r', e.target.value)}
                min={0}
                max={255}
              />
            </div>
            <div className="input-group">
              <input
                type="number"
                value={color.rgb.g}
                onChange={(e) => handleRgbChange('g', e.target.value)}
                min={0}
                max={255}
              />
            </div>
            <div className="input-group">
              <input
                type="number"
                value={color.rgb.b}
                onChange={(e) => handleRgbChange('b', e.target.value)}
                min={0}
                max={255}
              />
            </div>
          </div>
        </div>
        <div className="input-group">
          <label>HSL</label>
          <div style={{ fontFamily: 'Consolas, monospace', fontSize: '14px' }}>
            {color.hsl.h}°, {color.hsl.s}%, {color.hsl.l}%
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => onAddColor(color)}
        >
          + 添加到调色板
        </button>
      </div>
    </div>
  )
}

export default ColorPicker
