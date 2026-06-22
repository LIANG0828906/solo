import React, { useState } from 'react'
import type { FieldType, FieldParams } from './ForceField'

interface ControlPanelProps {
  fieldType: FieldType
  fieldParams: FieldParams
  onFieldTypeChange: (type: FieldType) => void
  onParamsChange: (params: FieldParams) => void
  onResetCamera: () => void
  fps: number
  isMobile: boolean
}

const fieldOptions: { value: FieldType; label: string }[] = [
  { value: 'gravity', label: '均匀引力场' },
  { value: 'vortex', label: '涡旋旋转场' }
]

export const ControlPanel: React.FC<ControlPanelProps> = ({
  fieldType,
  fieldParams,
  onFieldTypeChange,
  onParamsChange,
  onResetCamera,
  fps,
  isMobile
}) => {
  const [collapsed, setCollapsed] = useState(false)

  const handleGravityChange = (strength: number) => {
    onParamsChange({
      ...fieldParams,
      gravity: { strength }
    })
  }

  const handleVortexChange = (speed: number, strength: number) => {
    onParamsChange({
      ...fieldParams,
      vortex: { speed, strength }
    })
  }

  const panelStyle: React.CSSProperties = collapsed
    ? isMobile
      ? { height: '40px', width: '100%' }
      : { width: '40px' }
    : isMobile
      ? { height: 'auto', width: '100%' }
      : { width: '280px' }

  return (
    <div
      style={{
        position: 'fixed',
        ...(isMobile
          ? {
              bottom: 0,
              left: 0,
              right: 0,
              ...panelStyle
            }
          : {
              top: '50%',
              left: '16px',
              transform: 'translateY(-50%)',
              ...panelStyle
            }),
        backgroundColor: 'rgba(45, 45, 45, 0.85)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        color: '#fff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        zIndex: 100,
        userSelect: 'none'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
          cursor: 'pointer'
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        {!collapsed && (
          <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>
            控制面板
          </span>
        )}
        <span
          style={{
            fontSize: '12px',
            color: '#00B4D8',
            transform: collapsed ? (isMobile ? 'rotate(180deg)' : 'rotate(0deg)') : (isMobile ? 'rotate(0deg)' : 'rotate(180deg)'),
            transition: 'transform 0.3s ease',
            marginLeft: collapsed ? 'auto' : '8px',
            marginRight: collapsed ? 'auto' : '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isMobile ? (collapsed ? '▲' : '▼') : (collapsed ? '▶' : '◀')}
        </span>
      </div>

      {!collapsed && (
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#CCC',
                marginBottom: '6px'
              }}
            >
              场类型
            </label>
            <select
              value={fieldType}
              onChange={(e) => onFieldTypeChange(e.target.value as FieldType)}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '13px',
                cursor: 'pointer',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {fieldOptions.map((opt) => (
                <option key={opt.value} value={opt.value} style={{ backgroundColor: '#2D2D2D' }}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {fieldType === 'gravity' && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: '#CCC' }}>引力强度</label>
                <span style={{ fontSize: '12px', color: '#00B4D8', fontWeight: 500 }}>
                  {fieldParams.gravity.strength.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.1"
                value={fieldParams.gravity.strength}
                onChange={(e) => handleGravityChange(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '4px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background: 'linear-gradient(to right, #0066CC, #FF3300)',
                  borderRadius: '2px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              />
            </div>
          )}

          {fieldType === 'vortex' && (
            <>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#CCC' }}>旋转速度</label>
                  <span style={{ fontSize: '12px', color: '#00B4D8', fontWeight: 500 }}>
                    {fieldParams.vortex.speed.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.1"
                  value={fieldParams.vortex.speed}
                  onChange={(e) => handleVortexChange(parseFloat(e.target.value), fieldParams.vortex.strength)}
                  style={{
                    width: '100%',
                    height: '4px',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    background: 'linear-gradient(to right, #0066CC, #FF3300)',
                    borderRadius: '2px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: '#CCC' }}>向下拉力</label>
                  <span style={{ fontSize: '12px', color: '#00B4D8', fontWeight: 500 }}>
                    {fieldParams.vortex.strength.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={fieldParams.vortex.strength}
                  onChange={(e) => handleVortexChange(fieldParams.vortex.speed, parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '4px',
                    appearance: 'none',
                    WebkitAppearance: 'none',
                    background: 'linear-gradient(to right, #0066CC, #FF3300)',
                    borderRadius: '2px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
            </>
          )}

          <button
            onClick={onResetCamera}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#00E5FF'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 229, 255, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#00B4D8'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 180, 216, 0.3)'
            }}
            style={{
              width: '100%',
              padding: '10px 16px',
              backgroundColor: '#00B4D8',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 180, 216, 0.3)',
              marginBottom: '16px'
            }}
          >
            重置视角
          </button>

          {!isMobile && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ fontSize: '12px', color: '#CCC' }}>帧率</span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: fps >= 30 ? '#4ade80' : fps >= 20 ? '#fbbf24' : '#f87171'
                }}
              >
                {fps} FPS
              </span>
            </div>
          )}
        </div>
      )}

      {!collapsed && isMobile && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <span style={{ fontSize: '12px', color: '#CCC' }}>帧率</span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: fps >= 30 ? '#4ade80' : fps >= 20 ? '#fbbf24' : '#f87171'
            }}
          >
            {fps} FPS
          </span>
        </div>
      )}

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        select:focus {
          border-color: #00B4D8 !important;
          box-shadow: 0 0 0 2px rgba(0, 180, 216, 0.2);
        }
      `}</style>
    </div>
  )
}
