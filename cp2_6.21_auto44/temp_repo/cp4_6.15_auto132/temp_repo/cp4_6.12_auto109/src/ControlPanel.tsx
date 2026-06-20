import React from 'react'

interface ControlPanelProps {
  temperature: number
  setTemperature: (value: number) => void
  ionization: number
  setIonization: (value: number) => void
  viewAngle: number
  setViewAngle: (value: number) => void
  fps: number
}

const sliderStyle: React.CSSProperties = {
  width: '100%',
  height: '6px',
  borderRadius: '3px',
  background: '#333',
  outline: 'none',
  WebkitAppearance: 'none',
  appearance: 'none',
  cursor: 'pointer'
}

const sliderThumbStyle = `
  .nebula-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #00d4ff;
    cursor: pointer;
    border: none;
    transition: box-shadow 0.2s ease;
  }
  .nebula-slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 8px #00d4ff;
  }
  .nebula-slider:active::-webkit-slider-thumb {
    box-shadow: 0 0 8px #00d4ff;
  }
  .nebula-slider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #00d4ff;
    cursor: pointer;
    border: none;
    transition: box-shadow 0.2s ease;
  }
  .nebula-slider::-moz-range-thumb:hover {
    box-shadow: 0 0 8px #00d4ff;
  }
  .nebula-slider:active::-moz-range-thumb {
    box-shadow: 0 0 8px #00d4ff;
  }
`

export default function ControlPanel({
  temperature,
  setTemperature,
  ionization,
  setIonization,
  viewAngle,
  setViewAngle,
  fps
}: ControlPanelProps) {
  return (
    <>
      <style>{sliderThumbStyle}</style>
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '280px',
          background: 'rgba(20, 20, 30, 0.85)',
          borderRadius: '12px',
          padding: '20px',
          color: 'white',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
        }}
      >
        <h2 style={{ fontSize: '18px', marginBottom: '20px', color: '#00d4ff', fontWeight: 600 }}>
          Nebula Controls
        </h2>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '16px', color: 'white' }}>温度 (Temperature)</label>
            <span style={{ fontSize: '16px', color: '#00d4ff', fontWeight: 500 }}>
              {temperature}K
            </span>
          </div>
          <input
            type="range"
            min={2000}
            max={10000}
            step={100}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            className="nebula-slider"
            style={sliderStyle}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '16px', color: 'white' }}>电离度 (Ionization)</label>
            <span style={{ fontSize: '16px', color: '#00d4ff', fontWeight: 500 }}>
              {ionization}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={ionization}
            onChange={(e) => setIonization(Number(e.target.value))}
            className="nebula-slider"
            style={sliderStyle}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '16px', color: 'white' }}>视角旋转 (View Angle)</label>
            <span style={{ fontSize: '16px', color: '#00d4ff', fontWeight: 500 }}>
              {viewAngle}°
            </span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={viewAngle}
            onChange={(e) => setViewAngle(Number(e.target.value))}
            className="nebula-slider"
            style={sliderStyle}
          />
        </div>

        <div style={{ position: 'absolute', bottom: '12px', left: '20px', fontSize: '12px', color: '#aaa' }}>
          FPS: {fps}
        </div>
      </div>
    </>
  )
}
