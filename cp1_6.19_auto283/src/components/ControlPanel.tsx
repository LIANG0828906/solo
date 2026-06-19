import { useCoralStore, EnvironmentParams } from '../store/coralStore'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  onChange: (value: number) => void
}

function Slider({ label, value, min, max, step, unit, onChange }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100
  const knobColor = `hsl(${240 - percentage * 2.4}, 80%, 60%)`

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{
          color: '#ECF0F1',
          fontSize: '13px',
          fontWeight: 500,
          letterSpacing: '0.5px'
        }}>
          {label}
        </span>
        <span style={{
          color: '#3498DB',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: 'monospace'
        }}>
          {value.toFixed(step < 1 ? (step < 0.1 ? 2 : 1) : 0)} {unit}
        </span>
      </div>
      <div style={{
        position: 'relative',
        height: '24px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${percentage}%`,
            background: `linear-gradient(90deg, #3498DB, #E74C3C)`,
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            width: '100%',
            height: '24px',
            margin: 0,
            padding: 0,
            opacity: 0,
            cursor: 'pointer',
            zIndex: 2
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `calc(${percentage}% - 7px)`,
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: knobColor,
            border: '2px solid rgba(255, 255, 255, 0.9)',
            boxShadow: `0 0 8px ${knobColor}, 0 2px 4px rgba(0,0,0,0.3)`,
            pointerEvents: 'none',
            transition: 'left 0.1s ease, background 0.3s ease',
            zIndex: 1
          }}
        />
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '4px',
        fontSize: '10px',
        color: 'rgba(255, 255, 255, 0.4)'
      }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export function ControlPanel() {
  const { environmentParams, updateParams } = useCoralStore()

  const sliders: Array<{
    key: keyof EnvironmentParams
    label: string
    min: number
    max: number
    step: number
    unit: string
  }> = [
    { key: 'temperature', label: '水温', min: 18, max: 35, step: 0.5, unit: '°C' },
    { key: 'light', label: '光照强度', min: 500, max: 3000, step: 100, unit: '流明' },
    { key: 'waterFlow', label: '水流速度', min: 0, max: 5, step: 0.1, unit: 'm/s' },
    { key: 'nutrients', label: '营养盐浓度', min: 0.05, max: 1.0, step: 0.01, unit: 'mg/L' }
  ]

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      right: '24px',
      transform: 'translateY(-50%)',
      width: '280px',
      background: 'rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(52, 152, 219, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      zIndex: 100
    }}>
      <h2 style={{
        margin: '0 0 20px 0',
        color: '#ECF0F1',
        fontSize: '16px',
        fontWeight: 600,
        textAlign: 'center',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        环境参数控制
      </h2>

      {sliders.map((s) => (
        <Slider
          key={s.key}
          label={s.label}
          value={environmentParams[s.key]}
          min={s.min}
          max={s.max}
          step={s.step}
          unit={s.unit}
          onChange={(v) => updateParams({ [s.key]: v })}
        />
      ))}

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '8px',
        border: '1px solid rgba(52, 152, 219, 0.3)'
      }}>
        <div style={{
          color: '#BDC3C7',
          fontSize: '11px',
          lineHeight: '1.6',
          marginBottom: '8px'
        }}>
          <span style={{ color: '#E74C3C', fontWeight: 600 }}>⚠️ 警告：</span>
          水温超过30°C或营养盐低于0.1mg/L时珊瑚会开始白化
        </div>
        <div style={{
          color: '#2ECC71',
          fontSize: '11px',
          lineHeight: '1.6'
        }}>
          <span style={{ fontWeight: 600 }}>💡 提示：</span>
          适宜条件：水温24-28°C，光照1200-2000流明，营养盐0.2-0.5mg/L
        </div>
      </div>
    </div>
  )
}
