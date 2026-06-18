import React from 'react'

interface TemperatureSliderProps {
  temperature: number
  onChange: (value: number) => void
  disabled?: boolean
}

const TemperatureSlider: React.FC<TemperatureSliderProps> = ({
  temperature,
  onChange,
  disabled = false
}) => {
  const min = 500
  const max = 1500
  const percentage = ((temperature - min) / (max - min)) * 100

  const getColor = (pct: number): string => {
    const r = Math.round(33 + (244 - 33) * (pct / 100))
    const g = Math.round(150 + (67 - 150) * (pct / 100))
    const b = Math.round(243 + (54 - 243) * (pct / 100))
    return `rgb(${r}, ${g}, ${b})`
  }

  const color = getColor(percentage)

  return (
    <div
      className="temperature-slider"
      style={{
        position: 'absolute',
        left: '50%',
        top: '100px',
        transform: 'translateX(-50%)',
        width: '300px',
        zIndex: 15
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '6px',
          fontSize: '11px',
          color: '#888'
        }}
      >
        <span>{min}°C</span>
        <span style={{ color, fontWeight: 'bold', fontSize: '13px' }}>
          温度控制
        </span>
        <span>{max}°C</span>
      </div>

      <div
        style={{
          position: 'relative',
          height: '12px',
          borderRadius: '6px',
          background: `linear-gradient(to right, #2196F3, #F44336)`,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.4)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1
        }}
        onClick={(e) => {
          if (disabled) return
          const rect = e.currentTarget.getBoundingClientRect()
          const x = e.clientX - rect.left
          const pct = Math.max(0, Math.min(1, x / rect.width))
          const value = min + pct * (max - min)
          onChange(Math.round(value / 50) * 50)
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${percentage}%`,
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 10px ${color}, 0 2px 4px rgba(0,0,0,0.3)`,
            border: '2px solid #fff',
            transition: 'left 0.1s ease'
          }}
        />
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={50}
        value={temperature}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      />
    </div>
  )
}

export default TemperatureSlider
