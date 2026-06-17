import { useCallback, useRef, useEffect, useState } from 'react'
import { useColorStore } from '@/store/useColorStore'
import { getSecondaryHues } from '@/modules/colorHarmony'
import type { SchemeType } from '@/store/useColorStore'

const RING_SIZE = 260
const RING_RADIUS = RING_SIZE / 2
const MARKER_SIZE = 20
const SECONDARY_DOT_SIZE = 12
const SECONDARY_RING_RADIUS = 30

const SLIDER_WIDTH = RING_SIZE
const SLIDER_HEIGHT = 24
const THUMB_SIZE = 20

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
  const satSliderRef = useRef<HTMLDivElement>(null)
  const lightSliderRef = useRef<HTMLDivElement>(null)

  const [ringDragging, setRingDragging] = useState(false)
  const [satDragging, setSatDragging] = useState(false)
  const [lightDragging, setLightDragging] = useState(false)

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

  const handleRingPointerMove = useCallback((e: PointerEvent) => {
    if (!ringRef.current) return
    const rect = ringRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newHue = xyToHue(x, y)
    setHue(Math.round(newHue))
  }, [xyToHue, setHue])

  const handleRingPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setRingDragging(true)
    const rect = ringRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newHue = xyToHue(x, y)
    setHue(Math.round(newHue))
  }, [xyToHue, setHue])

  useEffect(() => {
    if (!ringDragging) return
    const onMove = (e: PointerEvent) => handleRingPointerMove(e)
    const onUp = () => setRingDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [ringDragging, handleRingPointerMove])

  const handleSatPointerMove = useCallback((e: PointerEvent) => {
    if (!satSliderRef.current) return
    const rect = satSliderRef.current.getBoundingClientRect()
    let x = e.clientX - rect.left
    x = Math.max(0, Math.min(SLIDER_WIDTH, x))
    const newSat = Math.round((x / SLIDER_WIDTH) * 100)
    setSaturation(newSat)
  }, [setSaturation])

  const handleSatPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setSatDragging(true)
    if (!satSliderRef.current) return
    const rect = satSliderRef.current.getBoundingClientRect()
    let x = e.clientX - rect.left
    x = Math.max(0, Math.min(SLIDER_WIDTH, x))
    const newSat = Math.round((x / SLIDER_WIDTH) * 100)
    setSaturation(newSat)
  }, [setSaturation])

  useEffect(() => {
    if (!satDragging) return
    const onMove = (e: PointerEvent) => handleSatPointerMove(e)
    const onUp = () => setSatDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [satDragging, handleSatPointerMove])

  const handleLightPointerMove = useCallback((e: PointerEvent) => {
    if (!lightSliderRef.current) return
    const rect = lightSliderRef.current.getBoundingClientRect()
    let x = e.clientX - rect.left
    x = Math.max(0, Math.min(SLIDER_WIDTH, x))
    const newLight = Math.round((x / SLIDER_WIDTH) * 100)
    setLightness(newLight)
  }, [setLightness])

  const handleLightPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setLightDragging(true)
    if (!lightSliderRef.current) return
    const rect = lightSliderRef.current.getBoundingClientRect()
    let x = e.clientX - rect.left
    x = Math.max(0, Math.min(SLIDER_WIDTH, x))
    const newLight = Math.round((x / SLIDER_WIDTH) * 100)
    setLightness(newLight)
  }, [setLightness])

  useEffect(() => {
    if (!lightDragging) return
    const onMove = (e: PointerEvent) => handleLightPointerMove(e)
    const onUp = () => setLightDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [lightDragging, handleLightPointerMove])

  const markerPos = hueToXY(hue)
  const secondaryHues = getSecondaryHues(hue, schemeType)

  const satThumbX = (saturation / 100) * SLIDER_WIDTH
  const lightThumbX = (lightness / 100) * SLIDER_WIDTH

  const satGradient = `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`
  const lightGradient = `linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 50%), hsl(${hue}, ${saturation}%, 100%))`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
      <div
        ref={ringRef}
        onPointerDown={handleRingPointerDown}
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
            transition: ringDragging ? 'none' : 'left 0.15s ease, top 0.15s ease, background 0.3s ease',
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: SLIDER_WIDTH }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>饱和度</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>低 → 高</span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#1A1A2E', fontWeight: 600, minWidth: '36px', textAlign: 'right' }}>
                {saturation}%
              </span>
            </div>
          </div>
          <div
            ref={satSliderRef}
            onPointerDown={handleSatPointerDown}
            style={{
              width: SLIDER_WIDTH,
              height: SLIDER_HEIGHT,
              borderRadius: SLIDER_HEIGHT / 2,
              background: satGradient,
              position: 'relative',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: satThumbX - THUMB_SIZE / 2,
                top: '50%',
                transform: 'translateY(-50%)',
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: '50%',
                background: colorScheme.primary,
                border: '2px solid white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
                transition: satDragging ? 'none' : 'left 0.05s ease, background 0.3s ease',
                zIndex: 5,
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>亮度</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#9CA3AF' }}>暗 → 亮</span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#1A1A2E', fontWeight: 600, minWidth: '36px', textAlign: 'right' }}>
                {lightness}%
              </span>
            </div>
          </div>
          <div
            ref={lightSliderRef}
            onPointerDown={handleLightPointerDown}
            style={{
              width: SLIDER_WIDTH,
              height: SLIDER_HEIGHT,
              borderRadius: SLIDER_HEIGHT / 2,
              background: lightGradient,
              position: 'relative',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: lightThumbX - THUMB_SIZE / 2,
                top: '50%',
                transform: 'translateY(-50%)',
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                borderRadius: '50%',
                background: colorScheme.primary,
                border: '2px solid white',
                boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                pointerEvents: 'none',
                transition: lightDragging ? 'none' : 'left 0.05s ease, background 0.3s ease',
                zIndex: 5,
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
