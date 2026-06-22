import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Track, ProjectData } from '../types'
import { PresetType, EnvelopeParams, EffectParams } from './SynthEngine'
import synthEngine from './SynthEngine'
import './ControlPanel.css'

interface ControlPanelProps {
  tracks: Track[]
  activeTrackId: string
  onTrackVolumeChange: (trackId: string, volume: number) => void
  onTrackPanChange: (trackId: string, pan: number) => void
  onTrackMuteToggle: (trackId: string) => void
  onTrackPresetChange: (trackId: string, preset: PresetType) => void
  onExportJSON: () => void
  onImportJSON: (data: ProjectData) => void
}

const Slider: React.FC<{
  value: number
  min: number
  max: number
  step?: number
  label: string
  onChange: (value: number) => void
  formatValue?: (value: number) => string
}> = ({ value, min, max, step = 0.01, label, onChange, formatValue }) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const percentage = ((value - min) / (max - min)) * 100

  const handleInteraction = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
      const newValue = min + (x / rect.width) * (max - min)
      const snapped = Math.round(newValue / step) * step
      onChange(Math.max(min, Math.min(max, snapped)))
    },
    [min, max, step, onChange]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      handleInteraction(e.clientX)
    },
    [handleInteraction]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      handleInteraction(e.clientX)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleInteraction])

  return (
    <div className="slider-row">
      <span className="slider-label">{label}</span>
      <div className="slider-container" ref={trackRef} onMouseDown={handleMouseDown}>
        <div className="slider-track">
          <div className="slider-fill" style={{ width: `${percentage}%` }} />
        </div>
        <div className="slider-thumb" style={{ left: `${percentage}%` }} />
      </div>
      <span className="slider-value">
        {formatValue ? formatValue(value) : value.toFixed(2)}
      </span>
    </div>
  )
}

const PanKnob: React.FC<{
  value: number
  onChange: (value: number) => void
}> = ({ value, onChange }) => {
  const knobRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const startYRef = useRef(0)
  const startValueRef = useRef(0)

  const rotation = value * 135

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)
      startYRef.current = e.clientY
      startValueRef.current = value
    },
    [value]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startYRef.current - e.clientY
      const newValue = startValueRef.current + deltaY / 100
      onChange(Math.max(-1, Math.min(1, newValue)))
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, onChange])

  const panLabel = value === 0 ? 'C' : value > 0 ? `R${Math.round(value * 100)}` : `L${Math.round(Math.abs(value) * 100)}`

  return (
    <>
      <div
        className="pan-knob"
        ref={knobRef}
        onMouseDown={handleMouseDown}
        title="声像"
      >
        <div
          className="pan-knob-indicator"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        />
      </div>
      <span className="pan-value">{panLabel}</span>
    </>
  )
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  tracks,
  activeTrackId,
  onTrackVolumeChange,
  onTrackPanChange,
  onTrackMuteToggle,
  onTrackPresetChange,
  onExportJSON,
  onImportJSON,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeTrack = tracks.find((t) => t.id === activeTrackId)

  const [envelope, setEnvelope] = useState<EnvelopeParams>({
    attack: 0.01,
    decay: 0.3,
    sustain: 0.6,
    release: 0.5,
  })

  const [effects, setEffects] = useState<EffectParams>({
    reverb: 0.3,
    reverbDecay: 2,
    delay: 0,
    delayFeedback: 0.3,
    delayTime: 0.5,
  })

  useEffect(() => {
    const state = synthEngine.getTrackState(activeTrackId)
    if (state) {
      setEnvelope(state.envelope)
      setEffects(state.effects)
    }
  }, [activeTrackId])

  const handlePresetChange = (preset: PresetType) => {
    onTrackPresetChange(activeTrackId, preset)
    synthEngine.setTrackPreset(activeTrackId, preset)
  }

  const handleEnvelopeChange = (key: keyof EnvelopeParams, value: number) => {
    const newEnvelope = { ...envelope, [key]: value }
    setEnvelope(newEnvelope)
    synthEngine.setTrackEnvelope(activeTrackId, newEnvelope)
  }

  const handleEffectChange = (key: keyof EffectParams, value: number) => {
    const newEffects = { ...effects, [key]: value }
    setEffects(newEffects)
    synthEngine.setTrackEffects(activeTrackId, newEffects)
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as ProjectData
        onImportJSON(data)
      } catch (err) {
        console.error('Failed to import JSON:', err)
        alert('导入失败：文件格式不正确')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const formatMs = (value: number) => `${Math.round(value * 1000)}ms`

  return (
    <div className="control-panel">
      <div className="panel-section">
        <div className="panel-section-title">🎹 音色预设</div>
        <div className="preset-buttons">
          <button
            className={`preset-btn ${activeTrack?.preset === 'piano' ? 'active' : ''}`}
            onClick={() => handlePresetChange('piano')}
          >
            钢琴
          </button>
          <button
            className={`preset-btn ${activeTrack?.preset === 'electronic' ? 'active' : ''}`}
            onClick={() => handlePresetChange('electronic')}
          >
            电子
          </button>
          <button
            className={`preset-btn ${activeTrack?.preset === 'bass' ? 'active' : ''}`}
            onClick={() => handlePresetChange('bass')}
          >
            贝斯
          </button>
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">📈 包络 (ADSR)</div>
        <div className="slider-group">
          <Slider
            label="起音"
            value={envelope.attack}
            min={0.001}
            max={2}
            step={0.001}
            onChange={(v) => handleEnvelopeChange('attack', v)}
            formatValue={formatMs}
          />
          <Slider
            label="衰减"
            value={envelope.decay}
            min={0.01}
            max={2}
            step={0.01}
            onChange={(v) => handleEnvelopeChange('decay', v)}
            formatValue={formatMs}
          />
          <Slider
            label="延音"
            value={envelope.sustain}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => handleEnvelopeChange('sustain', v)}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            label="释音"
            value={envelope.release}
            min={0.01}
            max={3}
            step={0.01}
            onChange={(v) => handleEnvelopeChange('release', v)}
            formatValue={formatMs}
          />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">✨ 效果器</div>
        <div className="slider-group">
          <Slider
            label="混响"
            value={effects.reverb}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => handleEffectChange('reverb', v)}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            label="混响衰减"
            value={effects.reverbDecay}
            min={0.1}
            max={10}
            step={0.1}
            onChange={(v) => handleEffectChange('reverbDecay', v)}
            formatValue={(v) => `${v.toFixed(1)}s`}
          />
          <Slider
            label="延迟"
            value={effects.delay}
            min={0}
            max={1}
            step={0.01}
            onChange={(v) => handleEffectChange('delay', v)}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            label="延迟反馈"
            value={effects.delayFeedback}
            min={0}
            max={0.9}
            step={0.01}
            onChange={(v) => handleEffectChange('delayFeedback', v)}
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <Slider
            label="延迟时间"
            value={effects.delayTime as number}
            min={0.05}
            max={2}
            step={0.05}
            onChange={(v) => handleEffectChange('delayTime', v)}
            formatValue={(v) => `${v.toFixed(2)}s`}
          />
        </div>
      </div>

      <div className="panel-section">
        <div className="panel-section-title">🎚️ 混音台</div>
        {tracks.map((track) => (
          <div key={track.id} className="mixer-track">
            <div
              className="mixer-track-color"
              style={{ background: track.color }}
            />
            <div className="mixer-track-info">
              <div className="mixer-track-name">{track.name}</div>
              <div className="mixer-track-controls">
                <button
                  className={`mute-btn ${track.muted ? 'muted' : ''}`}
                  onClick={() => onTrackMuteToggle(track.id)}
                  title={track.muted ? '取消静音' : '静音'}
                >
                  M
                </button>
                <div className="volume-slider">
                  <Slider
                    label=""
                    value={Math.max(0, (track.volume + 40) / 40)}
                    min={0}
                    max={1}
                    step={0.01}
                    onChange={(v) => onTrackVolumeChange(track.id, v * 40 - 40)}
                    formatValue={() => `${Math.round(track.volume)}dB`}
                  />
                </div>
                <PanKnob
                  value={track.pan}
                  onChange={(v) => onTrackPanChange(track.id, v)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="panel-section">
        <div className="panel-section-title">📁 导入导出</div>
        <div className="io-buttons">
          <button className="io-btn primary" onClick={onExportJSON}>
            ⬇ 导出 JSON
          </button>
          <button className="io-btn" onClick={handleImportClick}>
            ⬆ 导入 JSON
          </button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="file-input"
          accept=".json"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}

export default ControlPanel
