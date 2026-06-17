import React, { useCallback, useRef, useEffect, useState } from 'react'
import { useColorStore } from '@/store/useColorStore'
import { getSecondaryHues } from '@/modules/colorHarmony'
import type { SchemeType } from '@/store/useColorStore'

const RING_SIZE = 260
const RING_RADIUS = RING_SIZE / 2
const MARKER_SIZE = 20
const SECONDARY_DOT_SIZE = 12
const SECONDARY_RING_RADIUS = 30

const SCHEME_LABELS: Record<SchemeType, string> = {
  triadic: '三元色',
  complementary: '互补色',
  analogous: '类比色',
  splitComplementary: 'Split互补色',
}

export default function ColorPicker() {
  const hue = useColorStore(s => s.hue)
  const saturation = useColorStore(s => s.saturation)
  const lightness = useColorStore(s => s.lightness)
  const schemeType = useColorStore(s => s.schemeType)
  const colorScheme = useColorStore(s => s.colorScheme)
  const setHue = useColorStore(s => s.setHue)
  const setSaturation = useColorStore(s => s.setSaturation)
  const setLightness = useColorStore(s => s.setLightness)
  const setSchemeType = useColorStore(s => s.setSchemeType)

  const ringRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const hueToXY = useCallback((h: number) => {
    const rad = (h - 90) * (Math.PI / 180)
    return {
      x: RING_RADIUS + (RING_RADIUS - 18) * Math.cos(rad),
      y: RING_RADIUS + (RING_RADIUS - 18) * Math.sin(rad),
    }
  }, [])

  const xyToHue = useCallback((x: number, y: number) => {
    const cx = x - RING_RADIUS
    const cy = y - RING_RADIUS
    let angle = Math.atan2(cy, cx) * (180 / Math.PI) + 90
    if (angle < 0) angle += 360
    return angle % 360
  }, [])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!ringRef.current) return
    const rect = ringRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newHue = xyToHue(x, y)
    setHue(Math.round(newHue))
  }, [xyToHue, setHue])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setDragging(true)
    const rect = ringRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newHue = xyToHue(x, y)
    setHue(Math.round(newHue))
  }, [xyToHue, setHue])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: PointerEvent) => handlePointerMove(e)
    const onUp = () => setDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [dragging, handlePointerMove])

  const markerPos = hueToXY(hue)
  const secondaryHues = getSecondaryHues(hue, schemeType)

  const satGradient = `linear-gradient(to right, hsl(${hue},0%,${lightness}%), hsl(${hue},100%,${lightness}%))`
  const lightGradient = `linear-gradient(to right, hsl(${hue},${saturation}%,0%), hsl(${hue},${saturation}%,50%), hsl(${hue},${saturation}%,100%))`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
      <div
        ref={ringRef}
        onPointerDown={handlePointerDown}
        style={{
          width: RING_SIZE,
          height: RING_SIZE,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
          position: 'relative',
          cursor: 'crosshair',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 0 30px rgba(100,100,255,0.08)',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 22,
            borderRadius: '50%',
            background: '#FFFFFF',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.06)',
          }}
        />

        {secondaryHues.map((sh, i) => {
          const rad = (sh - 90) * (Math.PI / 180)
          const cx = RING_RADIUS + (RING_RADIUS - 18) * Math.cos(rad)
          const cy = RING_RADIUS + (RING_RADIUS - 18) * Math.sin(rad)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: cx - SECONDARY_RING_RADIUS - SECONDARY_DOT_SIZE / 2,
                top: cy - SECONDARY_RING_RADIUS - SECONDARY_DOT_SIZE / 2,
                width: SECONDARY_RING_RADIUS * 2 + SECONDARY_DOT_SIZE,
                height: SECONDARY_RING_RADIUS * 2 + SECONDARY_DOT_SIZE,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: SECONDARY_RING_RADIUS - SECONDARY_DOT_SIZE / 2,
                  top: SECONDARY_RING_RADIUS - SECONDARY_DOT_SIZE / 2,
                  width: SECONDARY_DOT_SIZE,
                  height: SECONDARY_DOT_SIZE,
                  borderRadius: '50%',
                  background: colorScheme.secondary[i] || '#999',
                  border: '1px solid white',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  transition: 'background 0.3s ease',
                }}
              />
            </div>
          )
        })}

        <div
          style={{
            position: 'absolute',
            left: markerPos.x - MARKER_SIZE / 2,
            top: markerPos.y - MARKER_SIZE / 2,
            width: MARKER_SIZE,
            height: MARKER_SIZE,
            borderRadius: '50%',
            background: colorScheme.primary,
            border: '2px solid white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            cursor: 'grab',
            transition: dragging ? 'none' : 'left 0.15s ease, top 0.15s ease, background 0.3s ease',
            zIndex: 10,
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: 90,
            height: 40,
            borderRadius: 8,
            background: colorScheme.primary,
            transition: 'background 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        />
        <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#1A1A2E', fontWeight: 600 }}>
          {colorScheme.primary.toUpperCase()}
        </span>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>饱和度 {saturation}%</label>
          <div style={{ position: 'relative', width: 200, height: 6 }}>
            <div
              style={{
                width: 200,
                height: 6,
                borderRadius: 3,
                background: satGradient,
              }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={saturation}
              onChange={e => setSaturation(Number(e.target.value))}
              style={{
                position: 'absolute',
                top: -6,
                left: 0,
                width: 200,
                height: 18,
                opacity: 0,
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: -6,
                left: saturation / 100 * 200 - 9,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                border: '1px solid #D1D5DB',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                pointerEvents: 'none',
                transition: 'left 0.05s ease',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>亮度 {lightness}%</label>
          <div style={{ position: 'relative', width: 200, height: 6 }}>
            <div
              style={{
                width: 200,
                height: 6,
                borderRadius: 3,
                background: lightGradient,
              }}
            />
            <input
              type="range"
              min={0}
              max={100}
              value={lightness}
              onChange={e => setLightness(Number(e.target.value))}
              style={{
                position: 'absolute',
                top: -6,
                left: 0,
                width: 200,
                height: 18,
                opacity: 0,
                cursor: 'pointer',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: -6,
                left: lightness / 100 * 200 - 9,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                border: '1px solid #D1D5DB',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                pointerEvents: 'none',
                transition: 'left 0.05s ease',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginBottom: '6px', display: 'block' }}>配色方案</label>
        <select
          value={schemeType}
          onChange={e => setSchemeType(e.target.value as SchemeType)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #D1D5DB',
            background: '#fff',
            fontSize: '14px',
            color: '#1A1A2E',
            cursor: 'pointer',
            outline: 'none',
            transition: 'border-color 0.3s ease',
          }}
        >
          {Object.entries(SCHEME_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
