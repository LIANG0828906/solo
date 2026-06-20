import { useState, useEffect, useRef, useCallback } from 'react'
import type { WaveformType, LFOTarget, ADSRParams } from './types'

interface ControlPanelProps {
  currentWaveform: WaveformType
  onWaveformChange: (type: WaveformType) => void
  envelope: ADSRParams
  onEnvelopeChange: (adsr: ADSRParams) => void
  lfoEnabled: boolean
  lfoFrequency: number
  lfoTarget: LFOTarget
  onLFOChange: (enabled: boolean, freq: number, target: LFOTarget) => void
  onNotePlay: (freq: number) => void
}

const WAVEFORMS: { type: WaveformType; name: string }[] = [
  { type: 'sine', name: '正弦' },
  { type: 'square', name: '方波' },
  { type: 'sawtooth', name: '锯齿' },
  { type: 'triangle', name: '三角' }
]

const NOTE_FREQS: { name: string; freq: number }[] = [
  { name: 'C4', freq: 261.63 },
  { name: 'D4', freq: 293.66 },
  { name: 'E4', freq: 329.63 },
  { name: 'F4', freq: 349.23 },
  { name: 'G4', freq: 392.00 },
  { name: 'A4', freq: 440.00 },
  { name: 'B4', freq: 493.88 },
  { name: 'C5', freq: 523.25 }
]

const LFO_TARGETS: { value: LFOTarget; label: string }[] = [
  { value: 'volume', label: '音量' },
  { value: 'pitch', label: '音高' },
  { value: 'width', label: '波形宽度' }
]

export function ControlPanel({
  currentWaveform,
  onWaveformChange,
  envelope,
  onEnvelopeChange,
  lfoEnabled,
  lfoFrequency,
  lfoTarget,
  onLFOChange,
  onNotePlay
}: ControlPanelProps) {
  return (
    <div className="control-panel">
      <div className="panel-section">
        <h3 className="section-title">波形选择</h3>
        <WaveformSelector current={currentWaveform} onChange={onWaveformChange} />
        <WaveformPreview type={currentWaveform} />
      </div>
      <div className="panel-section">
        <h3 className="section-title">包络调节</h3>
        <EnvelopeEditor value={envelope} onChange={onEnvelopeChange} />
      </div>
      <div className="panel-section">
        <h3 className="section-title">LFO 调制</h3>
        <LFOController
          enabled={lfoEnabled}
          frequency={lfoFrequency}
          target={lfoTarget}
          onChange={onLFOChange}
        />
      </div>
      <div className="panel-section">
        <h3 className="section-title">快捷音符</h3>
        <div className="note-buttons">
          {NOTE_FREQS.map((note) => (
            <button
              key={note.name}
              className="note-btn"
              onClick={() => onNotePlay(note.freq)}
            >
              {note.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function WaveformSelector({ current, onChange }: { current: WaveformType; onChange: (type: WaveformType) => void }) {
  return (
    <div className="waveform-selector">
      {WAVEFORMS.map((w) => (
        <button
          key={w.type}
          className={`waveform-btn ${current === w.type ? 'active' : ''}`}
          onClick={() => onChange(w.type)}
        >
          <WaveformIcon type={w.type} />
          <span>{w.name}</span>
        </button>
      ))}
    </div>
  )
}

function WaveformIcon({ type }: { type: WaveformType }) {
  const paths: Record<WaveformType, string> = {
    sine: 'M 2 12 Q 8 4, 14 12 T 26 12',
    square: 'M 2 12 L 2 6 L 8 6 L 8 18 L 14 18 L 14 6 L 20 6 L 20 18 L 26 18',
    sawtooth: 'M 2 18 L 8 6 L 14 18 L 20 6 L 26 18',
    triangle: 'M 2 12 L 8 6 L 14 18 L 20 6 L 26 12'
  }
  return (
    <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
      <path
        d={paths[type]}
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function WaveformPreview({ type }: { type: WaveformType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fadeIn, setFadeIn] = useState(0)

  useEffect(() => {
    setFadeIn(0)
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / 300, 1)
      setFadeIn(progress)
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
  }, [type])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    ctx.fillStyle = '#0b0e14'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(42, 58, 90, 0.5)'
    ctx.lineWidth = 1
    for (let x = 0; x <= w; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y <= h; y += 15) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    const samples = 200
    ctx.globalAlpha = fadeIn
    ctx.beginPath()
    ctx.strokeStyle = '#8ab4f8'
    ctx.lineWidth = 2
    ctx.shadowColor = 'rgba(138, 180, 248, 0.5)'
    ctx.shadowBlur = 8
    for (let i = 0; i < samples; i++) {
      const t = i / samples
      const x = t * w
      const phase = t * Math.PI * 2
      let value = 0
      switch (type) {
        case 'sine': value = Math.sin(phase); break
        case 'square': value = Math.sin(phase) >= 0 ? 1 : -1; break
        case 'sawtooth': value = 2 * (t - Math.floor(t + 0.5)); break
        case 'triangle': value = 2 * Math.abs(2 * (t - Math.floor(t + 0.5))) - 1; break
      }
      const y = h / 2 - value * (h / 2 - 10)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
  }, [type, fadeIn])

  return (
    <canvas
      ref={canvasRef}
      width={260}
      height={80}
      className="waveform-preview"
    />
  )
}

function EnvelopeEditor({ value, onChange }: { value: ADSRParams; onChange: (adsr: ADSRParams) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const w = 260
  const h = 120
  const padding = 20

  const getControlPoints = useCallback(() => {
    const totalTime = value.attack + value.decay + 1 + value.release
    const attackX = padding + (value.attack / totalTime) * (w - 2 * padding)
    const decayX = attackX + (value.decay / totalTime) * (w - 2 * padding)
    const releaseX = padding + ((totalTime - value.release) / totalTime) * (w - 2 * padding)
    const sustainY = h - padding - value.sustain * (h - 2 * padding)
    return [
      { x: padding, y: h - padding, label: 'A' },
      { x: attackX, y: padding, label: 'A' },
      { x: decayX, y: sustainY, label: 'D' },
      { x: releaseX, y: sustainY, label: 'S' },
      { x: w - padding, y: h - padding, label: 'R' }
    ]
  }, [value, w, h, padding])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const points = getControlPoints().slice(1, 4)
    for (let i = 0; i < points.length; i++) {
      const dx = x - points[i].x
      const dy = y - points[i].y
      if (Math.sqrt(dx * dx + dy * dy) < 12) {
        setDragging(i + 1)
        return
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging === null) return
    const rect = canvasRef.current!.getBoundingClientRect()
    const x = Math.max(padding, Math.min(w - padding, e.clientX - rect.left))
    const y = Math.max(padding, Math.min(h - padding, e.clientY - rect.top))
    const points = getControlPoints()
    const totalTime = value.attack + value.decay + 1 + value.release
    const timePerPixel = totalTime / (w - 2 * padding)
    const newEnvelope = { ...value }
    if (dragging === 1) {
      newEnvelope.attack = Math.max(0.01, (x - padding) * timePerPixel)
    } else if (dragging === 2) {
      newEnvelope.decay = Math.max(0.01, (x - points[1].x) * timePerPixel)
      newEnvelope.sustain = Math.max(0.01, Math.min(1, (h - padding - y) / (h - 2 * padding)))
    } else if (dragging === 3) {
      newEnvelope.release = Math.max(0.01, (w - padding - x) * timePerPixel)
    }
    onChange(newEnvelope)
  }

  const handleMouseUp = () => {
    setDragging(null)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#0b0e14'
    ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(42, 58, 90, 0.5)'
    ctx.lineWidth = 1
    for (let x = 0; x <= w; x += 20) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y <= h; y += 20) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    const points = getControlPoints()
    ctx.beginPath()
    ctx.strokeStyle = '#8ab4f8'
    ctx.lineWidth = 3
    ctx.shadowColor = 'rgba(138, 180, 248, 0.5)'
    ctx.shadowBlur = 8
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()
    ctx.shadowBlur = 0
    points.slice(1, 4).forEach((p, i) => {
      ctx.beginPath()
      ctx.fillStyle = dragging === i + 1 ? '#ffffff' : '#8ab4f8'
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.label, p.x, p.y - 14)
    })
    const labels = ['Attack', 'Decay', 'Sustain', 'Release']
    const values = [value.attack.toFixed(2), value.decay.toFixed(2), value.sustain.toFixed(2), value.release.toFixed(2)]
    ctx.font = '11px Inter, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    for (let i = 0; i < 4; i++) {
      ctx.textAlign = 'left'
      ctx.fillText(`${labels[i]}: ${values[i]}`, 10, h - 5 - (3 - i) * 14)
    }
  }, [value, dragging, getControlPoints, w, h, padding])

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      className="envelope-editor"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  )
}

function LFOController({
  enabled,
  frequency,
  target,
  onChange
}: {
  enabled: boolean
  frequency: number
  target: LFOTarget
  onChange: (enabled: boolean, freq: number, target: LFOTarget) => void
}) {
  const knobRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startYRef = useRef(0)
  const startFreqRef = useRef(0)

  const handleKnobMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true
    startYRef.current = e.clientY
    startFreqRef.current = frequency
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const deltaY = startYRef.current - e.clientY
      const delta = deltaY * 0.1
      const newFreq = Math.max(0.1, Math.min(20, startFreqRef.current + delta))
      onChange(enabled, Math.round(newFreq * 10) / 10, target)
    }
    const handleMouseUp = () => {
      isDraggingRef.current = false
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [enabled, target, onChange])

  const rotation = ((frequency - 0.1) / 19.9) * 270 - 135

  return (
    <div className="lfo-controller">
      <div className="lfo-controls">
        <div className="knob-container">
          <div
            ref={knobRef}
            className={`knob ${enabled ? 'active' : ''}`}
            onMouseDown={handleKnobMouseDown}
          >
            <div className="knob-track">
              {Array.from({ length: 27 }).map((_, i) => {
                const angle = -135 + i * 10
                const isActive = (frequency - 0.1) / 19.9 >= i / 26
                return (
                  <div
                    key={i}
                    className={`knob-tick ${isActive ? 'active' : ''}`}
                    style={{ transform: `rotate(${angle}deg)` }}
                  />
                )
              })}
            </div>
            <div className="knob-inner" style={{ transform: `rotate(${rotation}deg)` }}>
              <div className="knob-indicator" />
            </div>
          </div>
          <div className="knob-value">{frequency.toFixed(1)} Hz</div>
        </div>
        <div className="lfo-target">
          <label className="target-label">调制目标</label>
          <select
            className="target-select"
            value={target}
            onChange={(e) => onChange(enabled, frequency, e.target.value as LFOTarget)}
          >
            {LFO_TARGETS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        className={`lfo-toggle ${enabled ? 'active' : ''}`}
        onClick={() => onChange(!enabled, frequency, target)}
      >
        {enabled ? '关闭 LFO' : '开启 LFO'}
      </button>
    </div>
  )
}
