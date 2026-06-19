import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react'
import { hsl } from 'd3-color'
import type { ColorData } from '../types'
import { isValidHex, hexToColorData, rgbToHex } from '../utils/colorHarmony'

interface ColorPickerProps {
  color: ColorData
  onChange: (color: ColorData) => void
  onAddColor: (color: ColorData) => void
}

const RING_SIZE = 240
const RING_CENTER = RING_SIZE / 2
const RING_INNER = 40
const RING_OUTER = 100

const SV_SIZE = 240

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange, onAddColor }) => {
  const hueRef = useRef<HTMLDivElement>(null)
  const svRef = useRef<HTMLDivElement>(null)
  const isDraggingHue = useRef(false)
  const isDraggingSV = useRef(false)
  const [copyFeedback, setCopyFeedback] = useState('')

  const huePosition = useMemo(() => {
    const angle = color.hsl.h
    const radius = (RING_INNER + RING_OUTER) / 2
    const rad = ((angle - 90) * Math.PI) / 180
    return {
      x: RING_CENTER + radius * Math.cos(rad),
      y: RING_CENTER + radius * Math.sin(rad)
    }
  }, [color.hsl.h])

  const svPosition = useMemo(() => {
    const s = color.hsl.s / 100
    const l = color.hsl.l / 100
    return {
      x: s * SV_SIZE,
      y: (1 - l) * SV_SIZE
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
      if (angle >= 360) angle -= 360
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
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top))
      const s = (x / rect.width) * 100
      const l = (1 - y / rect.height) * 100
      const newColor = hexToColorData(hsl(color.hsl.h, s / 100, l / 100).hex())
      onChange(newColor)
    },
    [color.hsl.h, onChange]
  )

  const handleHuePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      isDraggingHue.current = true
      updateFromHue(e.clientX, e.clientY)
    },
    [updateFromHue]
  )

  const handleHuePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingHue.current) return
      e.preventDefault()
      updateFromHue(e.clientX, e.clientY)
    },
    [updateFromHue]
  )

  const handleHuePointerUp = useCallback(() => {
    isDraggingHue.current = false
  }, [])

  const handleSVPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      isDraggingSV.current = true
      updateFromSV(e.clientX, e.clientY)
    },
    [updateFromSV]
  )

  const handleSVPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingSV.current) return
      e.preventDefault()
      updateFromSV(e.clientX, e.clientY)
    },
    [updateFromSV]
  )

  const handleSVPointerUp = useCallback(() => {
    isDraggingSV.current = false
  }, [])

  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      if (isDraggingHue.current || isDraggingSV.current) {
        e.preventDefault()
      }
    }
    document.addEventListener('touchmove', preventDefault, { passive: false })
    return () => document.removeEventListener('touchmove', preventDefault)
  }, [])

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

  const handleHslChange = (channel: 'h' | 's' | 'l', value: string) => {
    const numValue = parseInt(value, 10)
    if (isNaN(numValue)) return

    const { h, s, l } = color.hsl
    let newH = h
    let newS = s
    let newL = l

    if (channel === 'h') {
      newH = Math.max(0, Math.min(360, numValue))
    } else if (channel === 's') {
      newS = Math.max(0, Math.min(100, numValue))
    } else if (channel === 'l') {
      newL = Math.max(0, Math.min(100, numValue))
    }

    const newColor = hexToColorData(hsl(newH, newS / 100, newL / 100).hex())
    onChange(newColor)
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyFeedback(label)
      setTimeout(() => setCopyFeedback(''), 1500)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopyFeedback(label)
      setTimeout(() => setCopyFeedback(''), 1500)
    }
  }

  return (
    <div className="picker-section">
      <div className="color-picker-container glass">
        <div className="picker-panels">
          <div
            ref={hueRef}
            className="hue-ring"
            onPointerDown={handleHuePointerDown}
            onPointerMove={handleHuePointerMove}
            onPointerUp={handleHuePointerUp}
            onPointerCancel={handleHuePointerUp}
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
            onPointerDown={handleSVPointerDown}
            onPointerMove={handleSVPointerMove}
            onPointerUp={handleSVPointerUp}
            onPointerCancel={handleSVPointerUp}
          >
            <div className="sv-panel-white" />
            <div className="sv-panel-black" />
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
      </div>

      <div className="glass color-values">
        <div
          className="color-preview"
          style={{ backgroundColor: color.hex }}
          onClick={() => copyToClipboard(color.hex, 'HEX')}
          title="点击复制HEX值"
        >
          {copyFeedback && <span className="copy-badge">已复制 {copyFeedback}</span>}
        </div>

        <div className="color-value-row">
          <div className="input-group">
            <label>HEX</label>
            <div className="input-with-btn">
              <input
                type="text"
                value={color.hex}
                onChange={handleHexChange}
                maxLength={7}
              />
              <button
                className="copy-btn"
                onClick={() => copyToClipboard(color.hex, 'HEX')}
                title="复制"
              >
                📋
              </button>
            </div>
          </div>
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
          <div className="rgb-inputs">
            <div className="input-group">
              <input
                type="number"
                value={color.hsl.h}
                onChange={(e) => handleHslChange('h', e.target.value)}
                min={0}
                max={360}
              />
            </div>
            <div className="input-group">
              <input
                type="number"
                value={color.hsl.s}
                onChange={(e) => handleHslChange('s', e.target.value)}
                min={0}
                max={100}
              />
            </div>
            <div className="input-group">
              <input
                type="number"
                value={color.hsl.l}
                onChange={(e) => handleHslChange('l', e.target.value)}
                min={0}
                max={100}
              />
            </div>
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
