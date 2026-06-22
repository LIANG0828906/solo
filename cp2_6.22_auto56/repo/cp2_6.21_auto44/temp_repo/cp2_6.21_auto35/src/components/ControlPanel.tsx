import { useState, useRef, useEffect, useCallback } from 'react'
import { CirclePicker, ColorResult } from 'react-color'
import { useEditorStore } from '@/store/useEditorStore'

const PRESET_COLORS = ['#00ffff', '#ff00ff', '#aaff00', '#ff6600']
const MIN_WIDTH = 280
const MAX_WIDTH = 400
const DEFAULT_WIDTH = 320

interface SliderProps {
  label: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  onCommit?: () => void
  format?: (v: number) => string
}

function Slider({ label, min, max, step, value, onChange, onCommit, format }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 12,
          color: 'rgba(255,255,255,0.7)',
          letterSpacing: 0.5,
        }}
      >
        <span>{label}</span>
        <span style={{ color: '#00ffff', fontFamily: 'Orbitron, monospace' }}>
          {format ? format(value) : value}
        </span>
      </div>
      <div className="slider-container">
        <div className="slider-track" />
        <div className="slider-fill" style={{ width: `${percent}%` }} />
        <div
          className="slider-thumb"
          style={{
            left: `${percent}%`,
            boxShadow: isDragging
              ? '0 0 20px #00ffff, 0 0 40px rgba(0, 255, 255, 0.8)'
              : undefined,
          }}
        />
        <input
          className="slider-input"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => {
            setIsDragging(false)
            onCommit?.()
          }}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => {
            setIsDragging(false)
            onCommit?.()
          }}
          onChange={(e) => {
            const raw = parseFloat(e.target.value)
            const snapped = Math.round(raw / step) * step
            onChange(snapped)
          }}
        />
      </div>
    </div>
  )
}

interface ControlPanelProps {
  onExportPNG: () => void
  onExportGIF: () => void
  isExporting: boolean
}

export function ControlPanel({ onExportPNG, onExportGIF, isExporting }: ControlPanelProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartX = useRef(0)
  const resizeStartWidth = useRef(DEFAULT_WIDTH)

  const text = useEditorStore((s) => s.text)
  const color = useEditorStore((s) => s.color)
  const thickness = useEditorStore((s) => s.thickness)
  const twist = useEditorStore((s) => s.twist)
  const glowIntensity = useEditorStore((s) => s.glowIntensity)

  const setText = useEditorStore((s) => s.setText)
  const setColor = useEditorStore((s) => s.setColor)
  const setThickness = useEditorStore((s) => s.setThickness)
  const setTwist = useEditorStore((s) => s.setTwist)
  const setGlowIntensity = useEditorStore((s) => s.setGlowIntensity)
  const pushHistory = useEditorStore((s) => s.pushHistory)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore((s) => s.canUndo())
  const canRedo = useEditorStore((s) => s.canRedo())

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    resizeStartX.current = e.clientX
    resizeStartWidth.current = width
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }, [width])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = resizeStartX.current - e.clientX
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeStartWidth.current + delta))
      setWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  const commitHistory = useCallback(() => {
    pushHistory()
  }, [pushHistory])

  const handleColorChange = (colorResult: ColorResult) => {
    setColor(colorResult.hex)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const filtered = e.target.value.replace(/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/? ]/g, '')
    setText(filtered)
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: `${width}px`,
        background: 'rgba(12, 12, 18, 0.9)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px 0 0 16px',
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: 50,
        transition: isResizing ? 'none' : 'width 0.2s ease-out',
        boxShadow: '-10px 0 40px rgba(0,0,0,0.5)',
      }}
    >
      <div
        className={`resize-handle ${isResizing ? 'dragging' : ''}`}
        onMouseDown={handleResizeStart}
      />

      <h1 className="neon-title" style={{ fontSize: 22, marginBottom: 4, textAlign: 'center' }}>
        霓虹工坊
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>
          文字内容
        </label>
        <input
          className="panel-input"
          type="text"
          value={text}
          onChange={handleTextChange}
          onBlur={commitHistory}
          maxLength={12}
          placeholder="最多12个字符"
          disabled={isExporting}
        />
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'right' }}>
          {text.length}/12
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>
          颜色预设
        </label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {PRESET_COLORS.map((c) => (
            <div
              key={c}
              className={`color-preset ${color.toLowerCase() === c.toLowerCase() ? 'active' : ''}`}
              style={{ background: c, color: c }}
              onClick={() => {
                if (isExporting) return
                setColor(c)
                commitHistory()
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: 0.5 }}>
          自定义颜色
        </label>
        <div style={{ padding: '4px 0' }}>
          <CirclePicker
            color={color}
            onChangeComplete={handleColorChange}
            onChange={handleColorChange}
            colors={[
              '#ff0000', '#ff6600', '#ffcc00', '#aaff00',
              '#00ff00', '#00ffcc', '#00ffff', '#0088ff',
              '#0000ff', '#6600ff', '#cc00ff', '#ff00ff',
              '#ff0088', '#ffffff', '#aaaaaa', '#333333',
            ]}
            width="100%"
            circleSize={22}
            circleSpacing={8}
          />
        </div>
      </div>

      <Slider
        label="厚度"
        min={0.1}
        max={0.8}
        step={0.05}
        value={thickness}
        onChange={setThickness}
        onCommit={commitHistory}
        format={(v) => v.toFixed(2)}
      />

      <Slider
        label="扭曲程度"
        min={-45}
        max={45}
        step={1}
        value={twist}
        onChange={setTwist}
        onCommit={commitHistory}
        format={(v) => `${Math.round(v)}°`}
      />

      <Slider
        label="发光强度"
        min={0.5}
        max={3.0}
        step={0.1}
        value={glowIntensity}
        onChange={setGlowIntensity}
        onCommit={commitHistory}
        format={(v) => v.toFixed(1)}
      />

      <div
        style={{
          display: 'flex',
          gap: 8,
          paddingTop: 4,
        }}
      >
        <button
          className="icon-btn"
          onClick={() => {
            undo()
          }}
          disabled={!canUndo || isExporting}
          title="撤销"
          style={{ flex: 1 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6" />
            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.7 3L3 13" />
          </svg>
        </button>
        <button
          className="icon-btn"
          onClick={() => {
            redo()
          }}
          disabled={!canRedo || isExporting}
          title="重做"
          style={{ flex: 1 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6" />
            <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.7 3L21 13" />
          </svg>
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          marginTop: 'auto',
          paddingTop: 8,
        }}
      >
        <button
          className="gradient-btn"
          onClick={onExportPNG}
          disabled={isExporting}
          style={{ padding: '12px 16px', fontSize: 14 }}
        >
          导出 PNG
        </button>
        <button
          className="gradient-btn"
          onClick={onExportGIF}
          disabled={isExporting}
          style={{
            padding: '12px 16px',
            fontSize: 14,
            background: 'linear-gradient(135deg, #ff00cc 0%, #6600ff 100%)',
            boxShadow: '0 4px 15px rgba(255, 0, 204, 0.3)',
          }}
        >
          导出 GIF
        </button>
      </div>
    </div>
  )
}
