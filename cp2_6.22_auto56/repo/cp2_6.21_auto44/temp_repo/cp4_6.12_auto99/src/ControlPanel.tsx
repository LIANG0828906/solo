import { useSimulationStore } from './store'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  color: string
  onChange: (v: number) => void
}

function ParameterSlider({ label, value, min, max, step, color, onChange }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="slider-container">
      <div className="slider-label">
        <span>{label}</span>
        <span className="slider-value" style={{ color: '#fff' }}>{value.toFixed(1)}</span>
      </div>
      <div className="slider-track-wrapper">
        <div
          className="slider-track-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="slider-input"
          style={{
            // @ts-ignore
            '--slider-color': color,
            '--thumb-size': '16px'
          } as React.CSSProperties}
        />
      </div>
    </div>
  )
}

interface ButtonProps {
  label: string
  color: string
  onClick: () => void
}

function ControlButton({ label, color, onClick }: ButtonProps) {
  return (
    <button
      className="control-btn"
      style={{ backgroundColor: color }}
      onClick={onClick}
      onMouseDown={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'
      }}
      onMouseUp={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.0)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.0)'
      }}
      onTouchStart={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = 'scale(0.95)'
      }}
      onTouchEnd={(e) => {
        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.0)'
      }}
    >
      {label}
    </button>
  )
}

export default function ControlPanel() {
  const {
    damping,
    stiffness,
    forceAmplitude,
    forceFrequency,
    isRunning,
    setDamping,
    setStiffness,
    setForceAmplitude,
    setForceFrequency,
    start,
    pause,
    reset
  } = useSimulationStore()

  return (
    <div className="control-panel">
      <h2 className="panel-title">参数控制</h2>

      <ParameterSlider
        label="阻尼系数"
        value={damping}
        min={0}
        max={20}
        step={0.1}
        color="#2196f3"
        onChange={setDamping}
      />

      <ParameterSlider
        label="弹簧刚度"
        value={stiffness}
        min={1}
        max={10}
        step={0.1}
        color="#4caf50"
        onChange={setStiffness}
      />

      <ParameterSlider
        label="驱动力幅度"
        value={forceAmplitude}
        min={0}
        max={10}
        step={0.1}
        color="#ff9800"
        onChange={setForceAmplitude}
      />

      <ParameterSlider
        label="驱动频率"
        value={forceFrequency}
        min={0.1}
        max={2}
        step={0.1}
        color="#9c27b0"
        onChange={setForceFrequency}
      />

      <div className="button-group">
        {!isRunning ? (
          <ControlButton
            label="开始"
            color="#4caf50"
            onClick={start}
          />
        ) : (
          <ControlButton
            label="暂停"
            color="#ff9800"
            onClick={pause}
          />
        )}
        <ControlButton
          label="重置"
          color="#f44336"
          onClick={reset}
        />
      </div>
    </div>
  )
}
