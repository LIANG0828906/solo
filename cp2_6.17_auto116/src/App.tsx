import { useState, useEffect } from 'react'
import GradientCanvas from './components/GradientCanvas'
import ColorStopEditor from './components/ColorStopEditor'
import CSSOutput from './components/CSSOutput'
import { useGradientStore, PRESETS } from './stores/gradientStore'

function App() {
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const gradientType = useGradientStore((s) => s.gradientType)
  const angle = useGradientStore((s) => s.angle)
  const radialShape = useGradientStore((s) => s.radialShape)
  const ellipseScaleX = useGradientStore((s) => s.ellipseScaleX)
  const ellipseScaleY = useGradientStore((s) => s.ellipseScaleY)

  const setGradientType = useGradientStore((s) => s.setGradientType)
  const setAngle = useGradientStore((s) => s.setAngle)
  const setRadialShape = useGradientStore((s) => s.setRadialShape)
  const setEllipseScaleX = useGradientStore((s) => s.setEllipseScaleX)
  const setEllipseScaleY = useGradientStore((s) => s.setEllipseScaleY)
  const applyPreset = useGradientStore((s) => s.applyPreset)
  const reset = useGradientStore((s) => s.reset)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleReset = () => {
    reset()
    setShowResetConfirm(false)
  }

  const layoutStyle: React.CSSProperties = isMobile
    ? {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
      }
    : {
        display: 'flex',
        flexDirection: 'row',
        gap: '12px',
        width: '100%',
      }

  const editorAreaStyle: React.CSSProperties = isMobile
    ? {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }
    : {
        width: '70%',
        display: 'flex',
        flexDirection: 'column',
      }

  const cssAreaStyle: React.CSSProperties = isMobile
    ? {
        width: '100%',
      }
    : {
        width: '30%',
        display: 'flex',
        justifyContent: 'flex-end',
      }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1E1E2E',
        color: '#E0E0E0',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setShowResetConfirm(true)}
              title="重置"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#FF6B6B',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#E05555')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FF6B6B')}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#E0E0E0',
              }}
            >
              ColorGradient
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => applyPreset(preset)}
                style={{
                  width: '80px',
                  height: '32px',
                  borderRadius: '6px',
                  background: preset.bgStartColor,
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div style={layoutStyle}>
          <div style={editorAreaStyle}>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <GradientCanvas />

              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '10%',
                  marginRight: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => setGradientType('linear')}
                    style={{
                      width: '80px',
                      height: '36px',
                      background: gradientType === 'linear' ? '#4A90D9' : '#E8E8E8',
                      color: gradientType === 'linear' ? 'white' : '#333',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'background 0.2s ease, color 0.2s ease',
                    }}
                  >
                    线性
                  </button>
                  <button
                    onClick={() => setGradientType('radial')}
                    style={{
                      width: '80px',
                      height: '36px',
                      background: gradientType === 'radial' ? '#4A90D9' : '#E8E8E8',
                      color: gradientType === 'radial' ? 'white' : '#333',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'background 0.2s ease, color 0.2s ease',
                    }}
                  >
                    径向
                  </button>
                </div>

                {gradientType === 'linear' && (
                  <div
                    style={{
                      background: '#2D2D3D',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#4A90D9',
                        marginBottom: '4px',
                        fontWeight: 600,
                      }}
                    >
                      {angle}°
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="1"
                      value={angle}
                      onChange={(e) => setAngle(parseInt(e.target.value))}
                      style={{
                        width: '240px',
                        height: '4px',
                        appearance: 'none',
                        background: '#D0D0D0',
                        borderRadius: '2px',
                        outline: 'none',
                        cursor: 'pointer',
                      }}
                    />
                  </div>
                )}

                {gradientType === 'radial' && (
                  <div
                    style={{
                      background: '#2D2D3D',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      minWidth: '240px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setRadialShape('circle')}
                        style={{
                          flex: 1,
                          height: '28px',
                          borderRadius: '4px',
                          background: radialShape === 'circle' ? '#4A90D9' : '#3D3D4D',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          transition: 'background 0.2s ease',
                        }}
                      >
                        圆形
                      </button>
                      <button
                        onClick={() => setRadialShape('ellipse')}
                        style={{
                          flex: 1,
                          height: '28px',
                          borderRadius: '4px',
                          background: radialShape === 'ellipse' ? '#4A90D9' : '#3D3D4D',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '12px',
                          transition: 'background 0.2s ease',
                        }}
                      >
                        椭圆形
                      </button>
                    </div>

                    {radialShape === 'ellipse' && (
                      <>
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '11px',
                              color: '#A0A0A0',
                              marginBottom: '2px',
                            }}
                          >
                            <span>X轴比例</span>
                            <span>{ellipseScaleX.toFixed(1)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="2.0"
                            step="0.1"
                            value={ellipseScaleX}
                            onChange={(e) => setEllipseScaleX(parseFloat(e.target.value))}
                            style={{
                              width: '100%',
                              height: '4px',
                              appearance: 'none',
                              background: '#D0D0D0',
                              borderRadius: '2px',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          />
                        </div>
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '11px',
                              color: '#A0A0A0',
                              marginBottom: '2px',
                            }}
                          >
                            <span>Y轴比例</span>
                            <span>{ellipseScaleY.toFixed(1)}</span>
                          </div>
                          <input
                            type="range"
                            min="0.2"
                            max="2.0"
                            step="0.1"
                            value={ellipseScaleY}
                            onChange={(e) => setEllipseScaleY(parseFloat(e.target.value))}
                            style={{
                              width: '100%',
                              height: '4px',
                              appearance: 'none',
                              background: '#D0D0D0',
                              borderRadius: '2px',
                              outline: 'none',
                              cursor: 'pointer',
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <ColorStopEditor />
            </div>

            <div
              style={{
                textAlign: 'center',
                marginTop: '12px',
                fontSize: '12px',
                color: '#888',
              }}
            >
              点击色标条空白处添加新色标 · 拖拽色标调整位置 · 右键色标删除
            </div>
          </div>

          <div style={cssAreaStyle}>
            <CSSOutput />
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#2D2D3D',
              borderRadius: '12px',
              padding: '24px',
              minWidth: '300px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '12px',
                color: '#E0E0E0',
              }}
            >
              确认重置
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#A0A0A0',
                marginBottom: '20px',
              }}
            >
              确定要重置所有色标和设置吗？此操作无法撤销。
            </div>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: '#3D3D4D',
                  color: '#E0E0E0',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#4D4D5D')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#3D3D4D')}
              >
                取消
              </button>
              <button
                onClick={handleReset}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: '#FF6B6B',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#E05555')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#FF6B6B')}
              >
                重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
