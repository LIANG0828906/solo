import React, { useState, useEffect, useRef } from 'react'
import { SemanticColor, rgbToHex } from '../store'

interface ColorPickerProps {
  color: SemanticColor
  position: { x: number; y: number }
  onClose: () => void
  onChange: (updates: Partial<SemanticColor>) => void
}

interface SliderProps {
  label: string
  value: number
  colorR: number
  colorG: number
  colorB: number
  channel: 'r' | 'g' | 'b'
  onChange: (value: number) => void
}

const Slider: React.FC<SliderProps> = ({ label, value, colorR, colorG, colorB, channel, onChange }) => {
  const [dragging, setDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const getGradient = (): string => {
    if (channel === 'r') return `linear-gradient(to right, rgb(0,${colorG},${colorB}), rgb(255,${colorG},${colorB}))`
    if (channel === 'g') return `linear-gradient(to right, rgb(${colorR},0,${colorB}), rgb(${colorR},255,${colorB}))`
    return `linear-gradient(to right, rgb(${colorR},${colorG},0), rgb(${colorR},${colorG},255))`
  }

  const updateFromEvent = (clientX: number) => {
    if (!trackRef.current) return
    const rect = trackRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    onChange(Math.round(percent * 255))
  }

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e: MouseEvent) => updateFromEvent(e.clientX)
    const handleUp = () => setDragging(false)
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleUp)
    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleUp)
    }
  }, [dragging])

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '12px', color: '#1E293B', fontWeight: 600, fontFamily: 'Monaco, monospace' }}>
          {value}
        </span>
      </div>
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          height: '6px',
          borderRadius: '3px',
          background: getGradient(),
          cursor: 'pointer',
        }}
        onMouseDown={(e) => {
          setDragging(true)
          updateFromEvent(e.clientX)
        }}
      >
        <div style={{
          position: 'absolute',
          left: `${(value / 255) * 100}%`,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          background: '#fff',
          border: '1px solid #E2E8F0',
          boxShadow: dragging
            ? '0 0 6px rgba(59,130,246,0.5), 0 2px 6px rgba(0,0,0,0.15)'
            : '0 2px 6px rgba(0,0,0,0.15)',
          transition: 'box-shadow 0.2s ease',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  )
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, position, onClose, onChange }) => {
  const [r, setR] = useState(color.r)
  const [g, setG] = useState(color.g)
  const [b, setB] = useState(color.b)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  const handleChannelChange = (channel: 'r' | 'g' | 'b', value: number) => {
    const newR = channel === 'r' ? value : r
    const newG = channel === 'g' ? value : g
    const newB = channel === 'b' ? value : b
    if (channel === 'r') setR(value)
    if (channel === 'g') setG(value)
    if (channel === 'b') setB(value)
    const hex = rgbToHex(newR, newG, newB)
    onChange({
      hex,
      r: newR,
      g: newG,
      b: newB,
    })
  }

  const currentHex = rgbToHex(r, g, b)

  return (
    <div
      ref={pickerRef}
      style={{
        position: 'fixed',
        left: Math.min(position.x, window.innerWidth - 280),
        top: Math.min(position.y, window.innerHeight - 420),
        width: '260px',
        background: '#fff',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        zIndex: 1000,
        border: '1px solid #E2E8F0',
      }}
    >
      <div style={{
        height: '48px',
        borderRadius: '8px',
        background: `linear-gradient(135deg, ${currentHex} 0%, ${currentHex}99 100%)`,
        marginBottom: '16px',
        border: '1px solid #E2E8F0',
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#1E293B' }}>{color.name}</div>
          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', fontFamily: 'Monaco, monospace' }}>
            {currentHex}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94A3B8',
            transition: 'background 0.2s ease',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#F1F5F9'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <Slider label="R" value={r} colorR={r} colorG={g} colorB={b} channel="r" onChange={(v) => handleChannelChange('r', v)} />
      <Slider label="G" value={g} colorR={r} colorG={g} colorB={b} channel="g" onChange={(v) => handleChannelChange('g', v)} />
      <Slider label="B" value={b} colorR={r} colorG={g} colorB={b} channel="b" onChange={(v) => handleChannelChange('b', v)} />
    </div>
  )
}

export default ColorPicker
