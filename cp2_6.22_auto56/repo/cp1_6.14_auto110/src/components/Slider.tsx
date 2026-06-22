import { useMemo } from 'react'

interface SliderProps {
  min?: number
  max?: number
  value: number
  onChange: (value: number) => void
  label: string
  showValue?: boolean
}

export default function Slider({
  min = 1,
  max = 100,
  value,
  onChange,
  label,
  showValue = true,
}: SliderProps) {
  const percentage = useMemo(() => {
    return ((value - min) / (max - min)) * 100
  }, [value, min, max])

  const trackStyle = useMemo(
    () => ({
      background: `linear-gradient(to right, #ff4444 0%, #44ff44 100%)`,
    }),
    []
  )

  const fillStyle = useMemo(
    () => ({
      width: `${percentage}%`,
      background: `linear-gradient(to right, #ff4444 0%, #44ff44 ${percentage}%)`,
    }),
    [percentage]
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  return (
    <div style={containerStyle}>
      <span style={labelStyle}>{label}</span>
      <div style={sliderContainerStyle}>
        <div style={{ ...trackBgStyle, ...trackStyle }}>
          <div style={{ ...fillStyle, ...fillBaseStyle }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={handleInputChange}
          style={inputStyle}
        />
      </div>
      {showValue && <span style={valueStyle}>{value}</span>}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  gap: '12px',
  padding: '8px 0',
}

const labelStyle: React.CSSProperties = {
  minWidth: '80px',
  fontSize: '14px',
  fontWeight: 500,
  color: '#333',
  flexShrink: 0,
}

const valueStyle: React.CSSProperties = {
  minWidth: '50px',
  fontSize: '14px',
  fontWeight: 600,
  color: '#333',
  textAlign: 'right',
  flexShrink: 0,
}

const sliderContainerStyle: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  height: '24px',
  display: 'flex',
  alignItems: 'center',
}

const trackBgStyle: React.CSSProperties = {
  position: 'absolute',
  width: '100%',
  height: '6px',
  borderRadius: '3px',
  overflow: 'hidden',
}

const fillBaseStyle: React.CSSProperties = {
  height: '100%',
  transition: 'width 0.15s ease',
}

const inputStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '24px',
  margin: 0,
  padding: 0,
  WebkitAppearance: 'none',
  appearance: 'none',
  background: 'transparent',
  cursor: 'pointer',
  zIndex: 1,
}

const thumbStyle = `
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  input[type="range"]::-webkit-slider-thumb:hover {
    filter: brightness(1.2);
    transform: scale(1.1);
  }

  input[type="range"]::-webkit-slider-thumb:active {
    transform: scale(0.95);
  }

  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    border: 3px solid #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  input[type="range"]::-moz-range-thumb:hover {
    filter: brightness(1.2);
    transform: scale(1.1);
  }

  input[type="range"]::-moz-range-thumb:active {
    transform: scale(0.95);
  }

  input[type="range"]::-moz-range-track {
    background: transparent;
    border: none;
  }

  input[type="range"]:focus {
    outline: none;
  }
`

const styleElement = document.createElement('style')
styleElement.textContent = thumbStyle
document.head.appendChild(styleElement)
