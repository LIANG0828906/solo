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

const WAVEFORMS: { type: WaveformType; name: string; subtitle: string }[] = [
  { type: 'sine', name: '正弦波', subtitle: 'Sine' },
  { type: 'square', name: '方波', subtitle: 'Square' },
  { type: 'sawtooth', name: '锯齿波', subtitle: 'Sawtooth' },
  { type: 'triangle', name: '三角波', subtitle: 'Triangle' }
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
      <div className="panel-row">
        <div className="panel-section waveform-card-section">
          <h3 className="section-title">波形选择</h3>
          <WaveformCardSelector current={currentWaveform} onChange={onWaveformChange} />
          <WaveformPreview type={currentWaveform} />
        </div>
        <div className="panel-section envelope-card-section">
          <h3 className="section-title">包络调节</h3>
          <EnvelopeEditor value={envelope} onChange={onEnvelopeChange} />
        </div>
      </div>
      <div className="panel-row">
        <div className="panel-section lfo-card-section">
          <h3 className="section-title">LFO 调制</h3>
          <LFOController
            enabled={lfoEnabled}
            frequency={lfoFrequency}
            target={lfoTarget}
            onChange={onLFOChange}
          />
        </div>
        <div className="panel-section notes-card-section">
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
    </div>
  )
}

function WaveformCardSelector({ current, onChange }: { current: WaveformType; onChange: (type: WaveformType) => void }) {
  return (
    <div className="waveform-card-selector">
      {WAVEFORMS.map((w) => {
        const isActive = current === w.type
        return (
          <button
            key={w.type}
            className={`waveform-card ${isActive ? 'active' : ''}`}
            onClick={() => onChange(w.type)}
          >
            <div className="waveform-card-icon">
              <WaveformIcon type={w.type} />
            </div>
            <div className="waveform-card-info">
              <span className="waveform-card-name">{w.name}</span>
              <span className="waveform-card-subtitle">{w.subtitle}</span>
            </div>
            {isActive && <div className="waveform-card-glow" />}
          </button>
        )
      })}
    </div>
  )
}

function WaveformIcon({ type }: { type: WaveformType }) {
  const paths: Record<WaveformType, string> = {
    sine: 'M 1 16 Q 7 4, 13 16 T 25 16 T 37 16',
    square: 'M 1 16 L 1 6 L 7 6 L 7 26 L 13 26 L 13 6 L 19 6 L 19 26 L 25 26 L 25 6 L 31 6 L 31 26 L 37 26',
    sawtooth: 'M 1 26 L 7 6 L 13 26 L 19 6 L 25 26 L 31 6 L 37 26',
    triangle: 'M 1 16 L 7 6 L 13 26 L 19 6 L 25 26 L 31 6 L 37 16'
  }
  return (
    <svg width="38" height="32" viewBox="0 0 38 32" fill="none">
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
  const rippleRef = useRef(0)
  const fadeInRef = useRef(0)
  const animationIdRef = useRef<number | null>(null)
  const lastTypeRef = useRef<WaveformType>(type)

  useEffect(() => {
    if (lastTypeRef.current !== type) {
      rippleRef.current = 0
      fadeInRef.current = 0
      lastTypeRef.current = type
    }
    const startTime = performance.now()
    const duration = 500
    const animate = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      fadeInRef.current = progress
      rippleRef.current = progress
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          drawWaveformPreview(ctx, canvas, type, fadeInRef.current, rippleRef.current)
        }
      }
      if (progress < 1) {
        animationIdRef.current = requestAnimationFrame(animate)
      }
    }
    animationIdRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [type])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    drawWaveformPreview(ctx, canvas, type, 1, 1)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={72}
      className="waveform-preview"
    />
  )
}

function drawWaveformPreview(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, type: WaveformType, fadeProgress: number, rippleProgress: number) {
  const w = canvas.width
  const h = canvas.height
  ctx.fillStyle = '#0b0e14'
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = 'rgba(42, 58, 90, 0.4)'
  ctx.lineWidth = 1
  for (let x = 0; x <= w; x += 28) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = 0; y <= h; y += 18) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }
  ctx.strokeStyle = 'rgba(138, 180, 248, 0.15)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(0, h / 2)
  ctx.lineTo(w, h / 2)
  ctx.stroke()
  if (rippleProgress < 1) {
    const rippleRadius = rippleProgress * Math.max(w, h) * 0.7
    const rippleAlpha = (1 - rippleProgress) * 0.5
    const centerX = w / 2
    const centerY = h / 2
    for (let i = 0; i < 3; i++) {
      const r = rippleRadius - i * 20
      if (r <= 0) continue
      ctx.beginPath()
      ctx.strokeStyle = `rgba(138, 180, 248, ${rippleAlpha * (1 - i * 0.25)})`
      ctx.lineWidth = 2 - i * 0.5
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, rippleRadius, 0, Math.PI * 2)
    ctx.clip()
    const samples = 200
    ctx.globalAlpha = fadeProgress
    ctx.beginPath()
    ctx.strokeStyle = '#8ab4f8'
    ctx.lineWidth = 2.5
    ctx.shadowColor = 'rgba(138, 180, 248, 0.6)'
    ctx.shadowBlur = 12
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
      const y = h / 2 - value * (h / 2 - 12)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
    ctx.restore()
  } else {
    const samples = 200
    ctx.globalAlpha = fadeProgress
    ctx.beginPath()
    ctx.strokeStyle = '#8ab4f8'
    ctx.lineWidth = 2.5
    ctx.shadowColor = 'rgba(138, 180, 248, 0.6)'
    ctx.shadowBlur = 12
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
      const y = h / 2 - value * (h / 2 - 12)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0
  }
}

function EnvelopeEditor({ value, onChange }: { value: ADSRParams; onChange: (adsr: ADSRParams) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dragging, setDragging] = useState<number | null>(null)
  const w = 280
  const h = 120
  const padding = 18

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
      if (Math.sqrt(dx * dx + dy * dy) < 14) {
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
    ctx.strokeStyle = 'rgba(42, 58, 90, 0.4)'
    ctx.lineWidth = 1
    for (let x = 0; x <= w; x += 28) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y <= h; y += 24) {
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
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12)
      gradient.addColorStop(0, dragging === i + 1 ? 'rgba(255, 255, 255, 0.9)' : 'rgba(138, 180, 248, 0.9)')
      gradient.addColorStop(1, 'rgba(138, 180, 248, 0.1)')
      ctx.fillStyle = gradient
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.fillStyle = dragging === i + 1 ? '#ffffff' : '#8ab4f8'
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.font = 'bold 10px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.label, p.x, p.y - 16)
    })
    const labels = ['A', 'D', 'S', 'R']
    const values = [value.attack.toFixed(2), value.decay.toFixed(2), value.sustain.toFixed(2), value.release.toFixed(2)]
    ctx.font = '10px Inter, sans-serif'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    for (let i = 0; i < 4; i++) {
      ctx.textAlign = 'left'
      ctx.fillText(`${labels[i]}: ${values[i]}`, 8, h - 6 - (3 - i) * 12)
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
  }, [enabled, target, onChange, frequency])

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
