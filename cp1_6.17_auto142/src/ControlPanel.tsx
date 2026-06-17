import React from 'react'
import { useForestStore } from './store'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  unit?: string
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, onChange, unit = '' }) => {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
      }}>
        <span style={{
          color: '#E6EDF3',
          fontSize: '14px',
          fontWeight: 500,
        }}>
          {label}
        </span>
        <span style={{
          color: '#00FF88',
          fontSize: '14px',
          fontWeight: 600,
          fontFamily: 'monospace',
        }}>
          {value.toFixed(0)}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '3px',
          background: '#2D3436',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  )
}

const ControlPanel: React.FC = () => {
  const light = useForestStore(state => state.light)
  const humidity = useForestStore(state => state.humidity)
  const temperature = useForestStore(state => state.temperature)
  const particleCount = useForestStore(state => state.particleCount)
  const treeCount = useForestStore(state => state.trees.length)
  const setLight = useForestStore(state => state.setLight)
  const setHumidity = useForestStore(state => state.setHumidity)
  const setTemperature = useForestStore(state => state.setTemperature)

  return (
    <div style={{
      width: '320px',
      height: '100vh',
      background: '#161B22',
      borderRadius: '16px',
      margin: '16px',
      padding: '28px 24px',
      boxShadow: '0 0 12px rgba(0,255,200,0.1)',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box',
      flexShrink: 0,
      overflowY: 'auto',
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          color: '#E6EDF3',
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '6px',
          letterSpacing: '-0.5px',
        }}>
          Particle Forest
        </h1>
        <p style={{
          color: '#8B949E',
          fontSize: '13px',
          lineHeight: 1.5,
        }}>
          Adjust environmental parameters to shape the forest
        </p>
      </div>

      <div style={{
        borderBottom: '1px solid #2D3436',
        paddingBottom: '24px',
        marginBottom: '24px',
      }}>
        <h2 style={{
          color: '#8B949E',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          marginBottom: '20px',
        }}>
          Environment Controls
        </h2>

        <Slider
          label="Light Intensity"
          value={light}
          min={0}
          max={100}
          onChange={setLight}
          unit="%"
        />

        <Slider
          label="Humidity"
          value={humidity}
          min={0}
          max={100}
          onChange={setHumidity}
          unit="%"
        />

        <Slider
          label="Temperature"
          value={temperature}
          min={-10}
          max={40}
          onChange={setTemperature}
          unit="°C"
        />
      </div>

      <div>
        <h2 style={{
          color: '#8B949E',
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1.2px',
          marginBottom: '16px',
        }}>
          Statistics
        </h2>
        <div style={{
          background: '#0D1117',
          borderRadius: '10px',
          padding: '16px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <span style={{ color: '#8B949E', fontSize: '13px' }}>Trees</span>
            <span style={{ color: '#E6EDF3', fontSize: '13px', fontWeight: 600 }}>
              {treeCount}
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <span style={{ color: '#8B949E', fontSize: '13px' }}>Particles</span>
            <span style={{ color: '#E6EDF3', fontSize: '13px', fontWeight: 600 }}>
              {particleCount.toLocaleString()} / 10,000
            </span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}>
            <span style={{ color: '#8B949E', fontSize: '13px' }}>Resolution</span>
            <span style={{
              color: treeCount > 80 ? '#FFA657' : '#00FF88',
              fontSize: '13px',
              fontWeight: 600,
            }}>
              {treeCount > 80 ? 'Reduced (1.5px)' : 'Standard (2px)'}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 'auto',
        paddingTop: '24px',
        borderTop: '1px solid #2D3436',
      }}>
        <p style={{
          color: '#484F58',
          fontSize: '11px',
          lineHeight: 1.6,
        }}>
          Drag to rotate • Scroll to zoom • Double-click to reset view
        </p>
      </div>
    </div>
  )
}

export default ControlPanel
