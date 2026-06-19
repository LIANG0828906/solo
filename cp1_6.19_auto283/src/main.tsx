import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { Scene } from './components/Scene'
import { ControlPanel } from './components/ControlPanel'
import { DataChart } from './components/DataChart'
import { useCoralStore } from './store/coralStore'

function App() {
  const { isPlacing, cancelPlacing } = useCoralStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPlacing) {
        cancelPlacing()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlacing, cancelPlacing])

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: '#0F1923',
      minWidth: '768px'
    }}>
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        textAlign: 'center'
      }}>
        <h1 style={{
          margin: 0,
          color: '#ECF0F1',
          fontSize: '20px',
          fontWeight: 600,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          textShadow: '0 0 20px rgba(52, 152, 219, 0.5)'
        }}>
          🪸 珊瑚礁生态模拟器
        </h1>
        <p style={{
          margin: '4px 0 0 0',
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '11px'
        }}>
          点击灰色基座选择珊瑚，拖拽放置到沙地 | 鼠标左键旋转视角 | 滚轮缩放
        </p>
      </div>

      <Scene />
      <ControlPanel />
      <DataChart />

      {isPlacing && (
        <div style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(46, 204, 113, 0.9)',
          color: '#fff',
          padding: '8px 16px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 500,
          zIndex: 200,
          boxShadow: '0 4px 12px rgba(46, 204, 113, 0.4)',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          点击沙地放置珊瑚 | 按 ESC 取消
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
