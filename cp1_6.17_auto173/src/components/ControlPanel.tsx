import React, { useCallback } from 'react'
import { useChoreographerStore } from '@/Choreographer'
import { IBeam } from '@/BeamModel'

interface ControlPanelProps {
  beam: IBeam | null
  isOpen: boolean
  onClose: () => void
}

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  gradient: string
  onChange: (value: number) => void
  displayValue?: string
}

const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  gradient,
  onChange,
  displayValue,
}) => {
  const percentage = ((value - min) / (max - min)) * 100

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value))
    },
    [onChange]
  )

  return (
    <div className="slider-wrapper">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{displayValue || `${value}${unit}`}</span>
      </div>
      <div className="slider-track-container">
        <div
          className="slider-gradient-track"
          style={{
            background: gradient,
          }}
        />
        <div
          className="slider-progress"
          style={{
            width: `${percentage}%`,
            background: gradient,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="slider-input"
        />
        <div
          className="slider-thumb"
          style={{
            left: `calc(${percentage}% - 10px)`,
            background: `hsl(${value}, 100%, 60%)`,
            boxShadow: `0 0 15px hsl(${value}, 100%, 60%), 0 0 30px hsl(${value}, 100%, 50%)`,
          }}
        />
      </div>
    </div>
  )
}

const ControlPanel: React.FC<ControlPanelProps> = ({ beam, isOpen, onClose }) => {
  const { updateBeam } = useChoreographerStore()

  const getBeamTypeName = (type: string) => {
    switch (type) {
      case 'point':
        return '点光源'
      case 'spot':
        return '聚光灯'
      case 'rotating':
        return '旋转光束'
      default:
        return type
    }
  }

  const handleHueChange = useCallback(
    (value: number) => {
      if (beam) {
        updateBeam(beam.id, { hue: value })
      }
    },
    [beam, updateBeam]
  )

  const handleBrightnessChange = useCallback(
    (value: number) => {
      if (beam) {
        updateBeam(beam.id, { brightness: value })
      }
    },
    [beam, updateBeam]
  )

  const handleRotationSpeedChange = useCallback(
    (value: number) => {
      if (beam) {
        updateBeam(beam.id, { rotationSpeed: value })
      }
    },
    [beam, updateBeam]
  )

  const hueGradient =
    'linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))'

  const brightnessGradient = `linear-gradient(to right, hsl(${beam?.hue || 200}, 100%, 10%), hsl(${beam?.hue || 200}, 100%, 100%))`

  const rotationGradient = 'linear-gradient(to right, #2a2a4a, #ffd700)'

  if (!beam) return null

  return (
    <>
      <div
        className={`control-panel-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <div className={`control-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <div>
            <h3 className="panel-title">光束参数</h3>
            <p className="panel-subtitle">{getBeamTypeName(beam.type)}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="panel-content">
          <div
            className="beam-preview"
            style={{
              background: `radial-gradient(circle, hsl(${beam.hue}, 100%, ${beam.brightness}%) 0%, transparent 70%)`,
            }}
          >
            <span
              className="preview-icon"
              style={{
                color: `hsl(${beam.hue}, 100%, ${beam.brightness}%)`,
                textShadow: `0 0 20px hsl(${beam.hue}, 100%, ${beam.brightness}%)`,
                animation: beam.type === 'rotating' && beam.rotationSpeed > 0 ? `spin ${1 / beam.rotationSpeed}s linear infinite` : 'none',
              }}
            >
              {beam.type === 'point' && '●'}
              {beam.type === 'spot' && '▲'}
              {beam.type === 'rotating' && '✺'}
            </span>
          </div>

          <Slider
            label="颜色色相"
            value={beam.hue}
            min={0}
            max={360}
            unit="°"
            gradient={hueGradient}
            onChange={handleHueChange}
          />

          <Slider
            label="亮度"
            value={beam.brightness}
            min={10}
            max={100}
            unit="%"
            gradient={brightnessGradient}
            onChange={handleBrightnessChange}
          />

          <Slider
            label="旋转速度"
            value={beam.rotationSpeed}
            min={0}
            max={10}
            step={0.1}
            unit="Hz"
            gradient={rotationGradient}
            onChange={handleRotationSpeedChange}
          />
        </div>

        <div className="panel-footer">
          <div className="beam-info">
            <span>位置: ({beam.gridX}, {beam.gridY})</span>
            <span>顺序: #{beam.order + 1}</span>
          </div>
        </div>
      </div>

      <style>{`
        .control-panel-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
          z-index: 998;
        }

        .control-panel-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        .control-panel {
          position: fixed;
          top: 0;
          right: -360px;
          width: 320px;
          height: 100vh;
          background: rgba(26, 26, 46, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px 0 0 12px;
          z-index: 999;
          transition: right 0.3s ease-out;
          display: flex;
          flex-direction: column;
        }

        .control-panel.open {
          right: 0;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 24px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .panel-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #ffffff;
        }

        .panel-subtitle {
          margin: 4px 0 0;
          font-size: 14px;
          color: #a0a0c0;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: #a0a0c0;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .close-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .panel-content {
          flex: 1;
          padding: 24px 20px;
          overflow-y: auto;
        }

        .beam-preview {
          width: 100%;
          aspect-ratio: 2;
          border-radius: 12px;
          background: rgba(10, 14, 39, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .preview-icon {
          font-size: 64px;
          transition: color 0.1s ease;
        }

        .slider-wrapper {
          margin-bottom: 24px;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .slider-label {
          font-size: 14px;
          color: #c0c0e0;
          font-weight: 500;
        }

        .slider-value {
          font-size: 14px;
          color: #ffd700;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
        }

        .slider-track-container {
          position: relative;
          height: 8px;
          border-radius: 4px;
          overflow: visible;
        }

        .slider-gradient-track {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 4px;
          opacity: 0.5;
        }

        .slider-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          border-radius: 4px;
          transition: width 0.05s ease;
        }

        .slider-input {
          position: absolute;
          top: -6px;
          left: 0;
          width: 100%;
          height: 20px;
          opacity: 0;
          cursor: pointer;
          margin: 0;
          padding: 0;
        }

        .slider-thumb {
          position: absolute;
          top: -6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          transition: left 0.05s ease, box-shadow 0.2s ease;
          pointer-events: none;
        }

        .slider-input:active + .slider-thumb,
        .slider-input:focus + .slider-thumb {
          transform: scale(1.2);
        }

        .panel-footer {
          padding: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .beam-info {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #8080a0;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .control-panel {
            width: 100%;
            right: -100%;
            border-radius: 0;
          }
        }
      `}</style>
    </>
  )
}

export default ControlPanel
