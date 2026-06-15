import React, { useEffect, useRef } from 'react'
import { useStore } from './store'
import Canvas from './components/Canvas'
import NodePanel from './components/NodePanel'
import Reader from './components/Reader'

const App: React.FC = () => {
  const { mode, setMode, loadFromIdb, resetReader } = useStore()
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  useEffect(() => {
    loadFromIdb()
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleEnterReader = () => {
    resetReader()
    setMode('reader')
  }

  const handleExitReader = () => {
    setMode('editor')
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.7s ease-out',
        }}
      >
        <Canvas containerRef={canvasContainerRef} />
      </div>

      {mode === 'editor' && <NodePanel containerRef={canvasContainerRef} />}

      {mode === 'editor' && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 16,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 40,
              background: 'rgba(26, 26, 46, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #00ffd5 0%, #ff007f 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    lineHeight: 1.1,
                    fontFamily: "'Orbitron', sans-serif",
                    background: 'linear-gradient(135deg, #00ffd5 0%, #ffffff 50%, #ff007f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  WORDWEAVER
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: '#6b7280',
                    marginTop: 3,
                    letterSpacing: '0.05em',
                  }}
                >
                  互动文字冒险编辑器
                </div>
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 32,
                background: 'rgba(255,255,255,0.1)',
                display: window.innerWidth < 640 ? 'none' : 'block',
              }}
            />

            <div
              style={{
                display: window.innerWidth < 640 ? 'none' : 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 10,
                color: '#6b7280',
                letterSpacing: '0.05em',
              }}
            >
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                拖拽节点
              </span>
              <span>·</span>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                滚轮缩放
              </span>
              <span>·</span>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.05)',
                }}
              >
                拖动连线
              </span>
            </div>
          </div>

          <div
            style={{
              position: 'fixed',
              top: 16,
              right: 16,
              zIndex: 50,
            }}
          >
            <button
              onClick={handleEnterReader}
              style={{
                position: 'relative',
                overflow: 'hidden',
                padding: '12px 22px',
                borderRadius: 14,
                transition: 'all 0.3s ease-out',
                background: 'linear-gradient(135deg, rgba(0, 255, 213, 0.15) 0%, rgba(0, 255, 213, 0.05) 40%, rgba(255, 0, 127, 0.05) 60%, rgba(255, 0, 127, 0.15) 100%)',
                border: '1.5px solid rgba(0, 255, 213, 0.4)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                cursor: 'pointer',
                animation: 'neon-flicker 4s ease-in-out infinite',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow =
                  '0 8px 24px rgba(0,255,213,0.2), 0 0 30px rgba(0,255,213,0.15), 0 0 60px rgba(255,0,127,0.1)'
                e.currentTarget.style.borderColor = 'rgba(0, 255, 213, 0.7)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.borderColor = 'rgba(0, 255, 213, 0.4)'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, rgba(0, 255, 213, 0.25) 0%, rgba(0, 255, 213, 0.1) 40%, rgba(255, 0, 127, 0.1) 60%, rgba(255, 0, 127, 0.25) 100%)',
                  opacity: 0,
                  transition: 'opacity 0.5s',
                  pointerEvents: 'none',
                }}
                id="btn-hover-bg"
              />
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <polygon
                    points="5 3 19 12 5 21 5 3"
                    fill="#00ffd5"
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(0, 255, 213, 0.6))',
                    }}
                  />
                </svg>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#00ffd5',
                    textShadow: '0 0 10px rgba(0, 255, 213, 0.4)',
                  }}
                >
                  运行剧情
                </span>
              </div>
            </button>
          </div>

          <div
            style={{
              position: 'fixed',
              bottom: 16,
              left: 16,
              zIndex: 30,
              display: window.innerWidth < 768 ? 'none' : 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(26, 26, 46, 0.7)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '8px 14px',
            }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#00ffd5',
                boxShadow: '0 0 6px rgba(0, 255, 213, 0.8)',
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            <span
              style={{
                fontSize: 10,
                color: '#9ca3af',
                letterSpacing: '0.05em',
              }}
            >
              数据已同步到 IndexedDB
            </span>
          </div>
        </>
      )}

      {mode === 'reader' && <Reader onExit={handleExitReader} />}
    </div>
  )
}

export default App
