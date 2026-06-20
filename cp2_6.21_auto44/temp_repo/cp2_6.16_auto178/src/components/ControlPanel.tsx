import { useState, useRef, useCallback, useEffect } from 'react'
import { useAudioStore, type NoiseType } from '../store/audioStore'
import './ControlPanel.css'

interface FrequencySliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

function FrequencySlider({ label, value, min, max, onChange }: FrequencySliderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((clientX: number) => {
    if (!sliderRef.current) return
    const rect = sliderRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const newValue = Math.round(min + percent * (max - min))
    onChange(newValue)
  }, [min, max, onChange])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    handleMove(e.clientX)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX)
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
  }, [isDragging, handleMove])

  const percent = ((value - min) / (max - min)) * 100

  return (
    <div className="frequency-slider">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{value} Hz</span>
      </div>
      <div
        ref={sliderRef}
        className={`slider-track ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="slider-fill" style={{ width: `${percent}%` }} />
        <div
          className="slider-thumb"
          style={{ left: `calc(${percent}% - 10px)` }}
        />
      </div>
    </div>
  )
}

interface NoiseButtonProps {
  type: NoiseType
  label: string
  icon: string
  isActive: boolean
  onClick: () => void
}

function NoiseButton({ type, label, icon, isActive, onClick }: NoiseButtonProps) {
  return (
    <button
      className={`noise-btn ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={label}
    >
      <span className="noise-icon">{icon}</span>
      <span className="noise-label">{label}</span>
    </button>
  )
}

interface VolumeKnobProps {
  value: number
  onChange: (value: number) => void
}

function VolumeKnob({ value, onChange }: VolumeKnobProps) {
  const knobRef = useRef<SVGSVGElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const startAngleRef = useRef(0)
  const startValueRef = useRef(value)

  const minAngle = -135
  const maxAngle = 135
  const angleRange = maxAngle - minAngle

  const angle = minAngle + value * angleRange

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    startAngleRef.current = e.clientY
    startValueRef.current = value
    e.preventDefault()
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startAngleRef.current - e.clientY
      const deltaPercent = delta / 200
      let newValue = startValueRef.current + deltaPercent
      newValue = Math.max(0, Math.min(1, newValue))
      onChange(newValue)
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

  const strokeDasharray = 2 * Math.PI * 45
  const strokeDashoffset = strokeDasharray * (1 - value)

  return (
    <div className="volume-knob-container">
      <svg
        ref={knobRef}
        className="volume-knob"
        viewBox="0 0 120 120"
        onMouseDown={handleMouseDown}
      >
        <defs>
          <linearGradient id="knobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#58A6FF" />
            <stop offset="100%" stopColor="#1f6feb" />
          </linearGradient>
          <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#21262d" />
            <stop offset="100%" stopColor="#30363d" />
          </linearGradient>
        </defs>

        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="url(#trackGradient)"
          strokeWidth="6"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDasharray * 0.25}
          strokeLinecap="round"
          transform="rotate(135 60 60)"
        />

        <circle
          cx="60"
          cy="60"
          r="45"
          fill="none"
          stroke="url(#knobGradient)"
          strokeWidth="6"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(135 60 60)"
          style={{ filter: 'drop-shadow(0 0 8px rgba(88, 166, 255, 0.5))' }}
        />

        <circle cx="60" cy="60" r="38" fill="#161B22" stroke="#21262d" strokeWidth="1" />

        <g transform={`rotate(${angle} 60 60)`}>
          <circle cx="60" cy="30" r="4" fill="#58A6FF" />
        </g>

        <text
          x="60"
          y="58"
          textAnchor="middle"
          className="knob-value-text"
          fill="#f0f6fc"
          fontSize="18"
          fontWeight="600"
        >
          {Math.round(value * 100)}%
        </text>
        <text
          x="60"
          y="78"
          textAnchor="middle"
          fill="#8b949e"
          fontSize="11"
        >
          音量
        </text>
      </svg>
    </div>
  )
}

export function ControlPanel() {
  const {
    leftFrequency,
    rightFrequency,
    noiseType,
    reverbDepth,
    volume,
    updateFrequency,
    setNoiseType,
    setReverbDepth,
    setVolume,
    getCurrentPreset,
  } = useAudioStore()

  const currentPreset = getCurrentPreset()

  const noiseTypes: { type: NoiseType; label: string; icon: string }[] = [
    { type: 'rain', label: '雨声', icon: '🌧️' },
    { type: 'fan', label: '风扇', icon: '🌀' },
    { type: 'ocean', label: '海浪', icon: '🌊' },
  ]

  return (
    <div className="control-panel">
      <div className="control-panel-header">
        <h2>{currentPreset?.name || '参数控制'}</h2>
        {currentPreset && <p className="preset-desc">{currentPreset.description}</p>}
      </div>

      <div className="control-section">
        <h3 className="section-title">频率调节</h3>
        <div className="frequency-sliders">
          <FrequencySlider
            label="左声道"
            value={leftFrequency}
            min={20}
            max={2000}
            onChange={(v) => updateFrequency('left', v)}
          />
          <FrequencySlider
            label="右声道"
            value={rightFrequency}
            min={20}
            max={2000}
            onChange={(v) => updateFrequency('right', v)}
          />
        </div>
        <div className="beat-info">
          <span className="beat-label">拍频差</span>
          <span className="beat-value">{Math.abs(rightFrequency - leftFrequency)} Hz</span>
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">白噪音</h3>
        <div className="noise-buttons">
          {noiseTypes.map((n) => (
            <NoiseButton
              key={n.type}
              type={n.type}
              label={n.label}
              icon={n.icon}
              isActive={noiseType === n.type}
              onClick={() => setNoiseType(noiseType === n.type ? 'none' : n.type)}
            />
          ))}
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">混响深度</h3>
        <div className="reverb-slider">
          <FrequencySlider
            label=""
            value={reverbDepth}
            min={0}
            max={100}
            onChange={setReverbDepth}
          />
          {reverbDepth >= 95 && (
            <div className="reverb-hint">模拟大教堂空间感</div>
          )}
        </div>
      </div>

      <div className="control-section volume-section">
        <h3 className="section-title">主音量</h3>
        <div className="volume-knob-wrapper">
          <VolumeKnob value={volume} onChange={setVolume} />
        </div>
      </div>
    </div>
  )
}
