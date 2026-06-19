import { useState } from 'react'
import { useSimStore } from '@/store/useSimStore'

interface ControlPanelProps {
  onCapture: () => string | null
}

export default function ControlPanel({ onCapture }: ControlPanelProps) {
  const { lightParams, setLight, addScheme, schemes } = useSimStore()
  const [schemeName, setSchemeName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateScheme = () => {
    if (schemes.length >= 4) {
      alert('最多只能创建4个方案')
      return
    }
    const name = schemeName.trim() || `方案 ${schemes.length + 1}`
    const thumbnail = onCapture()
    if (thumbnail) {
      addScheme(name, thumbnail)
      setSchemeName('')
      setIsCreating(false)
    }
  }

  const sliderStyle = {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: '#e0e0e0',
    outline: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer' as const
  }

  const Slider = ({
    label,
    value,
    min,
    max,
    unit,
    onChange
  }: {
    label: string
    value: number
    min: number
    max: number
    unit: string
    onChange: (value: number) => void
  }) => (
    <div style={{ marginBottom: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#424242'
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#2E7D32',
          padding: '2px 10px',
          background: 'rgba(46, 125, 50, 0.1)',
          borderRadius: '12px'
        }}>
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={sliderStyle}
      />
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '4px',
        fontSize: '11px',
        color: '#999'
      }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h3 style={{
        margin: '0 0 20px 0',
        fontSize: '15px',
        fontWeight: 600,
        color: '#2E7D32'
      }}>
        光照参数控制
      </h3>

      <Slider
        label="光照强度"
        value={lightParams.intensity}
        min={0}
        max={1000}
        unit="lux"
        onChange={(v) => setLight({ intensity: v })}
      />

      <Slider
        label="色温"
        value={lightParams.colorTemp}
        min={2700}
        max={6500}
        unit="K"
        onChange={(v) => setLight({ colorTemp: v })}
      />

      <Slider
        label="光照角度"
        value={lightParams.angle}
        min={0}
        max={360}
        unit="°"
        onChange={(v) => setLight({ angle: v })}
      />

      <div style={{
        marginTop: 'auto',
        paddingTop: '20px',
        borderTop: '1px solid #eee'
      }}>
        {isCreating ? (
          <div style={{ marginBottom: '12px' }}>
            <input
              type="text"
              value={schemeName}
              onChange={(e) => setSchemeName(e.target.value)}
              placeholder="输入方案名称..."
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '13px',
                outline: 'none',
                marginBottom: '8px',
                transition: 'border-color 0.2s'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateScheme()
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleCreateScheme}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
              >
                确认创建
              </button>
              <button
                onClick={() => {
                  setIsCreating(false)
                  setSchemeName('')
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#f0f0f0',
                  color: '#666',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)'
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            disabled={schemes.length >= 4}
            style={{
              width: '100%',
              padding: '12px',
              background: schemes.length >= 4 ? '#ccc' : 'linear-gradient(135deg, #4CAF50, #388E3C)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: schemes.length >= 4 ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              if (schemes.length < 4) {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(76, 175, 80, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            onMouseDown={(e) => {
              if (schemes.length < 4) {
                e.currentTarget.style.transform = 'scale(0.95)'
              }
            }}
            onMouseUp={(e) => {
              if (schemes.length < 4) {
                e.currentTarget.style.transform = 'scale(1.05)'
              }
            }}
          >
            <span>+</span>
            <span>创建光照方案</span>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              ({schemes.length}/4)
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
