import React, { useRef, useState, useEffect } from 'react'
import { ParticleCanvas, ParticleCanvasHandle } from './painter/ParticleCanvas'
import { ControlPanel } from './painter/ControlPanel'

const App: React.FC = () => {
  const canvasRef = useRef<ParticleCanvasHandle>(null)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        background: '#0D1117',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        {isMobile ? (
          <MobileWrapper>
            <ControlPanel canvasRef={canvasRef} />
          </MobileWrapper>
        ) : (
          <ControlPanel canvasRef={canvasRef} />
        )}
      </div>

      {!isMobile && (
        <div
          style={{
            width: '1px',
            background: '#30363D',
            flexShrink: 0,
            zIndex: 5,
          }}
        />
      )}

      <div
        style={{
          flex: 1,
          height: isMobile ? 'calc(100vh - 56px)' : '100vh',
          width: isMobile ? '100%' : 'calc(100% - 280px)',
          minWidth: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <ParticleCanvas ref={canvasRef} />
      </div>
    </div>
  )
}

const MobileWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div
      style={{
        width: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          height: '56px',
          background: '#161B22',
          borderBottom: '1px solid #30363D',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div>
          <span
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#C9D1D9',
              letterSpacing: '-0.3px',
            }}
          >
            SoundCanvas
          </span>
          <span
            style={{
              fontSize: '11px',
              color: '#8B949E',
              marginLeft: '8px',
            }}
          >
            音频可视化画布
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            padding: '8px 14px',
            background: isOpen ? '#58A6FF' : '#21262D',
            border: `1px solid ${isOpen ? '#58A6FF' : '#30363D'}`,
            borderRadius: '8px',
            color: isOpen ? '#fff' : '#C9D1D9',
            fontSize: '12px',
            fontWeight: 500,
            transition: 'all 0.2s ease',
          }}
        >
          {isOpen ? '收起' : '控制面板'}
        </button>
      </div>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '56px',
            left: 0,
            right: 0,
            maxHeight: 'calc(100vh - 56px)',
            overflowY: 'auto',
            zIndex: 100,
            animation: 'slideDown 0.25s ease-out',
          }}
        >
          <style>{`
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          {children}
        </div>
      )}
    </div>
  )
}

export default App
