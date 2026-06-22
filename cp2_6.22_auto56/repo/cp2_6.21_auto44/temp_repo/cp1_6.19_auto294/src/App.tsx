import { useState, useEffect } from 'react'
import ThumbnailGrid from './components/ThumbnailGrid'
import PreviewPanel from './components/PreviewPanel'
import ControlPanel from './components/ControlPanel'

function App() {
  const [isIPad, setIsIPad] = useState(false)

  useEffect(() => {
    const checkResize = () => {
      const w = window.innerWidth
      setIsIPad(w <= 1024 && w >= 768)
    }

    checkResize()
    window.addEventListener('resize', checkResize)
    return () => window.removeEventListener('resize', checkResize)
  }, [])

  const leftRatio = isIPad ? 2 : 3
  const centerRatio = isIPad ? 5 : 5
  const rightRatio = isIPad ? 3 : 3

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100vh',
        backgroundColor: '#1A1A2E',
        minWidth: isIPad ? '768px' : '1024px',
      }}
    >
      <div
        style={{
          height: 56,
          backgroundColor: '#16213E',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#EAEAEA',
            letterSpacing: 1,
          }}
        >
          PhotoBatch
          <span
            style={{
              fontSize: 13,
              fontWeight: 400,
              color: '#8892B0',
              marginLeft: 12,
            }}
          >
            批量调色 · 水印 · 海报生成
          </span>
        </h1>
      </div>

      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          gap: 12,
          padding: 12,
        }}
      >
        <div
          style={{
            flex: leftRatio,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: '#0F3460',
          }}
        >
          <ThumbnailGrid columns={isIPad ? 3 : 5} />
        </div>

        <div
          style={{
            flex: centerRatio,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: '#0F3460',
          }}
        >
          <PreviewPanel />
        </div>

        <div
          style={{
            flex: rightRatio,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 8,
            overflow: 'hidden',
            backgroundColor: '#0F3460',
          }}
        >
          <ControlPanel />
        </div>
      </div>
    </div>
  )
}

export default App
