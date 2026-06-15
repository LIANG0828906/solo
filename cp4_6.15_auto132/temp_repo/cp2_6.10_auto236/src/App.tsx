import { useState, useEffect } from 'react'
import Scene from './components/Scene'
import Panel from './components/Panel'

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#0b1d2a',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.5s ease'
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      >
        <Scene />
      </div>

      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          color: '#39ff14',
          fontSize: '24px',
          fontWeight: 'bold',
          letterSpacing: '4px',
          textShadow: '0 0 20px rgba(57, 255, 20, 0.5)',
          pointerEvents: 'none'
        }}
      >
        深渊叩响 · ABYSS ECHO
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          zIndex: 10
        }}
      >
        <Panel type="control" />
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          zIndex: 10
        }}
      >
        <Panel type="analysis" />
      </div>

      <div
        style={{
          position: 'absolute',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          color: 'rgba(57, 255, 20, 0.6)',
          fontSize: '12px',
          letterSpacing: '2px',
          pointerEvents: 'none'
        }}
      >
        拖拽旋转视角 · 滚轮缩放 · 点击放置声呐探测球
      </div>
    </div>
  )
}

export default App
