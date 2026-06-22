import ParticleForest from './ParticleForest'
import ControlPanel from './ControlPanel'

export default function App() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        background: '#0A0A0A',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          flex: '0 0 70%',
          width: '70%',
          height: '100%',
          position: 'relative',
        }}
      >
        <ParticleForest />
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            color: 'rgba(224, 224, 224, 0.6)',
            fontSize: '12px',
            letterSpacing: '2px',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              marginBottom: '4px',
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            WEATHER FOREST
          </div>
          <div>数字粒子森林 · 实时天气驱动</div>
        </div>
      </div>

      <div
        style={{
          flex: '0 0 30%',
          width: '30%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          boxSizing: 'border-box',
        }}
      >
        <ControlPanel />
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="width: 70%"] {
            flex: 1 !important;
            width: 100% !important;
            height: calc(100% - 120px) !important;
          }
          div[style*="width: 30%"] {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: 120px !important;
            padding: 0 !important;
            z-index: 100 !important;
          }
        }
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          background: #0A0A0A;
        }
        
        #root {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  )
}
