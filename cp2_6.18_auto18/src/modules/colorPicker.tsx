import { useCallback, useRef, useEffect, useState } from 'react'
import { useColorStore } from '@/store/useColorStore'
import { getSecondaryHues } from '@/modules/colorHarmony'
import type { SchemeType } from '@/store/useColorStore'

const RING_SIZE = 260
const RING_RADIUS = RING_SIZE / 2
const MARKER_SIZE = 20
const SECONDARY_DOT_SIZE = 12
const SECONDARY_RING_RADIUS = 30

const SV_PANEL_WIDTH = RING_SIZE
const SV_PANEL_HEIGHT = 40

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
  const svPanelRef = useRef<HTMLDivElement>(null)
  const [ringDragging, setRingDragging] = useState(false)
  const [svDragging, setSvDragging] = useState(false)

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

  const handleSvPointerMove = useCallback((e: PointerEvent) => {
    if (!svPanelRef.current) return
    const rect = svPanelRef.current.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top
    x = Math.max(0, Math.min(SV_PANEL_WIDTH, x))
    y = Math.max(0, Math.min(SV_PANEL_HEIGHT, y))
    const newSat = Math.round((x / SV_PANEL_WIDTH) * 100)
    const newLight = Math.round(100 - (y / SV_PANEL_HEIGHT) * 100)
    setSaturation(newSat)
    setLightness(newLight)
  }, [setSaturation, setLightness])

  const handleSvPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    setSvDragging(true)
    if (!svPanelRef.current) return
    const rect = svPanelRef.current.getBoundingClientRect()
    let x = e.clientX - rect.left
    let y = e.clientY - rect.top
    x = Math.max(0, Math.min(SV_PANEL_WIDTH, x))
    y = Math.max(0, Math.min(SV_PANEL_HEIGHT, y))
    const newSat = Math.round((x / SV_PANEL_WIDTH) * 100)
    const newLight = Math.round(100 - (y / SV_PANEL_HEIGHT) * 100)
    setSaturation(newSat)
    setLightness(newLight)
  }, [setSaturation, setLightness])

  useEffect(() => {
    if (!svDragging) return
    const onMove = (e: PointerEvent) => handleSvPointerMove(e)
    const onUp = () => setSvDragging(false)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [svDragging, handleSvPointerMove])

  const markerPos = hueToXY(hue)
  const secondaryHues = getSecondaryHues(hue, schemeType)

  const svMarkerX = (saturation / 100) * SV_PANEL_WIDTH
  const svMarkerY = (1 - lightness / 100) * SV_PANEL_HEIGHT

  const verticalBg = `linear-gradient(to bottom, #fff 0%, hsl(${hue}, 100%, 50%) 50%, #000 100%)`

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: SV_PANEL_WIDTH }}>
        <label style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>
          饱和度 {saturation}% · 亮度 {lightness}%
        </label>
        <div
          ref={svPanelRef}
          onPointerDown={handleSvPointerDown}
          style={{
            width: SV_PANEL_WIDTH,
            height: SV_PANEL_HEIGHT,
            borderRadius: 8,
            position: 'relative',
            cursor: 'crosshair',
            background: verticalBg,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `linear-gradient(to right, rgba(255,255,255,0.85), rgba(255,255,255,0) 40%)`,
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: svMarkerX - MARKER_SIZE / 2,
              top: svMarkerY - MARKER_SIZE / 2,
              width: MARKER_SIZE,
              height: MARKER_SIZE,
              borderRadius: '50%',
              background: colorScheme.primary,
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              cursor: 'grab',
              pointerEvents: 'none',
              transition: svDragging ? 'none' : 'left 0.05s ease, top 0.05s ease, background 0.3s ease',
              zIndex: 5,
            }}
          />
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
