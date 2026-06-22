import { useEffect, useRef, useState } from 'react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label: string
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const v = max
  const d = max - min
  s = max === 0 ? 0 : d / max
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break
      case g: h = (b - r) / d + 2; break
      case b: h = (r - g) / d + 4; break
    }
    h /= 6
  }
  return { h: h * 360, s: s * 100, v: v * 100 }
}

function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; v /= 100
  let r = 0, g = 0, b = 0
  const i = Math.floor(h * 6)
  const f = h * 6 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }
  return { r: r * 255, g: g * 255, b: b * 255 }
}

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const svRef = useRef<HTMLDivElement>(null)
  const { r, g, b } = hexToRgb(value)
  const { h, s, v } = rgbToHsv(r, g, b)
  const [hue, setHue] = useState(h)
  const [sat, setSat] = useState(s)
  const [val, setVal] = useState(v)

  useEffect(() => {
    const { r, g, b } = hexToRgb(value)
    const hsv = rgbToHsv(r, g, b)
    setHue(hsv.h)
    setSat(hsv.s)
    setVal(hsv.v)
  }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleSV(e: React.MouseEvent<HTMLDivElement>, down?: boolean) {
    if (!svRef.current) return
    const rect = svRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
    const newSat = x * 100
    const newVal = (1 - y) * 100
    setSat(newSat)
    setVal(newVal)
    const rgb = hsvToRgb(hue, newSat, newVal)
    onChange(rgbToHex(rgb.r, rgb.g, rgb.b))
  }

  function handleHue(e: React.ChangeEvent<HTMLInputElement>) {
    const h = Number(e.target.value)
    setHue(h)
    const rgb = hsvToRgb(h, sat, val)
    onChange(rgbToHex(rgb.r, rgb.g, rgb.b))
  }

  function handleHex(e: React.ChangeEvent<HTMLInputElement>) {
    let v = e.target.value
    if (!v.startsWith('#')) v = '#' + v
    if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v)
  }

  const hueBg = hsvToRgb(hue, 100, 100)
  const hueHex = rgbToHex(hueBg.r, hueBg.g, hueBg.b)

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <span style={{ fontSize: 13, color: '#444', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="text"
          value={value}
          onChange={handleHex}
          style={{ width: 76, fontSize: 12, fontFamily: 'Inter, monospace', padding: '6px 8px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', color: '#333' }}
        />
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={`选择${label}`}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid #ddd',
            background: value,
            cursor: 'pointer',
            padding: 0,
            boxSizing: 'border-box',
            boxShadow: 'inset 0 0 0 2px #fff',
          }}
        />
      </div>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            zIndex: 100,
            background: '#fff',
            padding: 14,
            borderRadius: 12,
            boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            border: '1px solid #eee',
            width: 220,
          }}
        >
          <div
            ref={svRef}
            onMouseDown={(e) => {
              handleSV(e, true)
              const move = (ev: MouseEvent) => handleSV(ev as unknown as React.MouseEvent<HTMLDivElement>)
              const up = () => {
                document.removeEventListener('mousemove', move)
                document.removeEventListener('mouseup', up)
              }
              document.addEventListener('mousemove', move)
              document.addEventListener('mouseup', up)
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0]
              handleSV({ clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLDivElement>, true)
              const move = (ev: TouchEvent) => {
                const t = ev.touches[0]
                handleSV({ clientX: t.clientX, clientY: t.clientY } as React.MouseEvent<HTMLDivElement>)
              }
              const end = () => {
                document.removeEventListener('touchmove', move)
                document.removeEventListener('touchend', end)
              }
              document.addEventListener('touchmove', move)
              document.addEventListener('touchend', end)
            }}
            style={{
              position: 'relative',
              width: '100%',
              height: 160,
              borderRadius: 8,
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueHex})`,
              cursor: 'crosshair',
              marginBottom: 10,
              userSelect: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: `${sat}%`,
                top: `${100 - val}%`,
                width: 14,
                height: 14,
                border: '2px solid #fff',
                borderRadius: '50%',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                flex: 1,
                height: 12,
                borderRadius: 6,
                background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                position: 'relative',
              }}
            >
              <input
                type="range"
                min={0}
                max={360}
                value={Math.round(hue)}
                onChange={handleHue}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  margin: 0,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: `${(hue / 360) * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 10,
                  height: 16,
                  border: '2px solid #fff',
                  borderRadius: 3,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3)',
                  background: hueHex,
                  pointerEvents: 'none',
                }}
              />
            </div>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                border: '1px solid #ddd',
                background: value,
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
