import React, { useState, useEffect } from 'react'

export interface ControlPanelProps {
  brightnessThreshold: number
  onBrightnessChange: (value: number) => void
  showPlanets: boolean
  onShowPlanetsChange: (value: boolean) => void
  showLabels: boolean
  onShowLabelsChange: (value: boolean) => void
  showOrbits: boolean
  onShowOrbitsChange: (value: boolean) => void
  onResetCamera: () => void
}

const Checkbox: React.FC<{
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}> = ({ checked, onChange, label }) => (
  <label
    style={{
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      userSelect: 'none',
      fontSize: 16,
      color: '#ffffff',
      transition: 'color 0.2s ease',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.color = '#7E57C2')}
    onMouseLeave={(e) => (e.currentTarget.style.color = '#ffffff')}
  >
    <div
      style={{
        width: 20,
        height: 20,
        borderRadius: 4,
        border: `2px solid ${checked ? '#7E57C2' : '#5C6BC0'}`,
        backgroundColor: checked ? '#7E57C2' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        transition: 'all 0.2s ease',
      }}
      onClick={() => onChange(!checked)}
    >
      {checked && (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6L5 9L10 3"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
    {label}
  </label>
)

const ControlPanel: React.FC<ControlPanelProps> = ({
  brightnessThreshold,
  onBrightnessChange,
  showPlanets,
  onShowPlanetsChange,
  showLabels,
  onShowLabelsChange,
  showOrbits,
  onShowOrbitsChange,
  onResetCamera,
}) => {
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        height: mobileOpen ? 240 : 60,
        background: 'rgba(15,15,30,0.95)',
        borderTop: '2px solid #7E57C2',
        borderLeft: 'none',
        padding: mobileOpen ? 20 : '0 20px',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        transition: 'height 0.3s ease',
        overflow: 'hidden',
      }
    : {
        position: 'fixed',
        top: 0,
        right: 0,
        width: 240,
        height: '100vh',
        background: 'rgba(15,15,30,0.85)',
        borderLeft: '2px solid #7E57C2',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflowY: 'auto',
      }

  const titleStyle: React.CSSProperties = isMobile
    ? {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: mobileOpen ? 16 : 0,
        cursor: 'pointer',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }
    : {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 20,
        paddingBottom: 12,
        borderBottom: '1px solid rgba(126,87,194,0.3)',
      }

  return (
    <div style={panelStyle}>
      <div style={titleStyle} onClick={() => isMobile && setMobileOpen(!mobileOpen)}>
        <span>控制面板</span>
        {isMobile && (
          <span style={{ fontSize: 14, color: '#7E57C2' }}>
            {mobileOpen ? '收起 ▼' : '展开 ▲'}
          </span>
        )}
      </div>

      {(!isMobile || mobileOpen) && (
        <>
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 10,
                fontSize: 16,
              }}
            >
              <span>最小亮度</span>
              <span style={{ color: '#FFD54F', fontWeight: 600 }}>
                {(brightnessThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <div style={{ position: 'relative', width: isMobile ? 'calc(100% - 60px)' : 180, height: 20, display: 'flex', alignItems: 'center' }}>
              <div
                style={{
                  position: 'absolute',
                  width: isMobile ? 'calc(100% - 40px)' : 180,
                  height: 4,
                  background: 'rgba(92,107,192,0.2)',
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${brightnessThreshold * 100}%`,
                    background: '#5C6BC0',
                    borderRadius: 2,
                    transition: 'width 0.1s ease',
                  }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={brightnessThreshold * 100}
                onChange={(e) => onBrightnessChange(parseInt(e.target.value) / 100)}
                style={{
                  position: 'absolute',
                  width: isMobile ? 'calc(100% - 40px)' : 180,
                  height: 4,
                  appearance: 'none',
                  background: 'transparent',
                  outline: 'none',
                  cursor: 'pointer',
                  zIndex: 2,
                }}
              />
              <style>{`
                input[type=range]::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: #7E57C2;
                  cursor: pointer;
                  border: 2px solid #ffffff;
                  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                  transition: all 0.2s ease;
                }
                input[type=range]::-webkit-slider-thumb:hover {
                  transform: scale(1.15);
                  background: #9C7CD6;
                }
                input[type=range]::-moz-range-thumb {
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: #7E57C2;
                  cursor: pointer;
                  border: 2px solid #ffffff;
                }
              `}</style>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: isMobile ? 16 : 14,
              marginBottom: 28,
            }}
          >
            <Checkbox checked={showPlanets} onChange={onShowPlanetsChange} label="显示行星" />
            <Checkbox checked={showLabels} onChange={onShowLabelsChange} label="显示标签" />
            <Checkbox checked={showOrbits} onChange={onShowOrbitsChange} label="显示轨道线" />
          </div>

          <button
            onClick={onResetCamera}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5C3F90'
              e.currentTarget.style.transform = 'translateY(-1px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#7E57C2'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
            style={{
              background: '#7E57C2',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 6,
              fontSize: 16,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              width: '100%',
              fontFamily: "'Segoe UI', sans-serif",
              boxShadow: '0 2px 8px rgba(126,87,194,0.4)',
            }}
          >
            重置视角
          </button>

          {!isMobile && (
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 20,
                fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.6,
              }}
            >
              <div style={{ marginBottom: 4 }}>🖱️ 拖拽旋转视角</div>
              <div style={{ marginBottom: 4 }}>🔍 滚轮缩放</div>
              <div>⌨️ WASD 平移</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ControlPanel
